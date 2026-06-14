import { useState, useEffect } from "react";
import { X, Paperclip, Loader2 } from "lucide-react";
import { chatWithClaude } from "../api/atropicApi";
import { supabase } from "../lib/supabase";
import { formatReferenceMonth } from "../utils/date";
import ReceiptDisplay from "./ReceiptDisplay";
import toast, { Toaster } from "react-hot-toast"; // Importa o toast

// Função para salvar o recibo no Supabase
const handleSubmit = async (e: React.FormEvent | null, data: any) => {
  if (e) e.preventDefault();

  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("User not authenticated");

    let fileUrl = data?.file_url;

    if (data.file) {
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(`${user.data.user.id}/${fileName}`, data.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("receipts")
        .getPublicUrl(`${user.data.user.id}/${fileName}`);

      fileUrl = publicUrl;
    }

    const receiptData = {
      amount: parseFloat(data.value),
      reference_month: formatReferenceMonth(data.referenceMonth),
      description: data.description,
      category_id: data.category_id || null,
      type: data.type,
      ...(fileUrl && { file_url: fileUrl }),
      user_id: user.data.user.id,
    };

    const { error: insertError } = await supabase.from("receipts").insert(receiptData);
    if (insertError) throw insertError;
  } catch (err: any) {
    console.log(err);
    throw err; // Propaga o erro para o caller
  } finally {
    console.log("remove logs");
  }
};

export default function ChatComponent({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Busca as categorias do banco
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca as categorias assim que o componente monta
  useEffect(() => {
    fetchCategories();
  }, []);

  // Cria uma nova categoria se ela não existir
  const createCategory = async (name: string, color: string = "#0000FF") => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name,
          color,
          user_id: user.data.user.id,
        })
        .select();

      if (error) throw error;

      const newCategory = data[0];
      // Atualiza o estado com a nova categoria
      setCategories((prev: any[]) => [...prev, newCategory]);
      return newCategory.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Lida com o upload do arquivo (imagem ou PDF)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      // Permite imagens ou PDFs
      if (
        !uploadedFile.type.startsWith("image/") &&
        uploadedFile.type !== "application/pdf"
      ) {
        setError("Apenas arquivos de imagem ou PDF são permitidos");
        return;
      }

      setFile(uploadedFile);
      setError(null);

      const reader = new FileReader();
      reader.onload = () => {
        // Para imagens, podemos mostrar uma preview; para PDF, a preview pode ser omitida ou tratada de forma diferente
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  // Lida com o envio da mensagem
  const handleSendMessage = async () => {
    if (!text.trim() && !file) {
      setError("Por favor, digite uma mensagem ou anexe um arquivo");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const messageContent = [];

      // Adiciona as categorias disponíveis no prompt para ajudar a IA a deduzir
      if (categories.length > 0) {
        const categoryNames = categories.map((c) => c.name).join(", ");
        messageContent.push({
          type: "text",
          text: `Categorias disponíveis: ${categoryNames}.`,
        });
      }

      if (text.trim()) {
        messageContent.push({ type: "text", text: "input do usuario:" + text });
      }

      // Inclui o arquivo no prompt se houver e se tiver sido lido
      if (file && filePreview) {
        messageContent.push({
          type: file.type === "application/pdf" ? "document" : "image",
          source: {
            type: "base64",
            media_type: file.type,
            data: filePreview.split(",")[1],
          },
        });
      }

      // Chama a IA com o conteúdo da mensagem
      const responseText = await chatWithClaude(messageContent);
      setResponse(responseText);

      // Faz o parse do JSON retornado pela IA
      const parsedResponse = JSON.parse(responseText);

      // Verifica se a categoria retornada pela IA existe na lista
      let categoryId = null;
      if (parsedResponse.category) {
        const existing = categories.find(
          (cat) => cat.name.toLowerCase() === parsedResponse.category.toLowerCase()
        );
        if (existing) {
          categoryId = existing.id;
        } else {
          // Se a categoria não existir, cria uma nova (com cor padrão)
          categoryId = await createCategory(parsedResponse.category);
        }
      }

      // Envia os dados para o Supabase, associando o recibo à categoria identificada
      await handleSubmit(null, {
        value: parsedResponse.value,
        referenceMonth: parsedResponse.referenceMonth,
        description: parsedResponse.description,
        category_id: categoryId,
        type: parsedResponse.type,
        file,
      });

      // Se tudo ocorreu bem, mostra um toast, limpa os inputs e atualiza a página/estado
      toast.success("Recibo cadastrado com sucesso!");
      setText("");
      setFile(null);
      setFilePreview(null);
      setResponse(null);
      // Opcional: recarrega a lista de recibos ou a página inteira
      // window.location.reload(); // ou chame uma função de fetch de recibos

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster /> {/* Componente para exibir as toast notifications */}
      <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl z-50">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">AI Support</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {response && (
            <div className="mb-4">
              <ReceiptDisplay data={JSON.parse(response)} />
            </div>
          )}

          <textarea
            className="w-full mb-4 p-2 border rounded"
            placeholder="E aqui seu recibo e suba automaticamente (exemplo: 100.00, 'Gasolina', 'Transferencia')..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1 cursor-pointer text-blue-600 hover:text-blue-700">
              <Paperclip className="h-5 w-5" />
              <span>Anexar</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                disabled={isLoading}
              />
            </label>
            {file && <span className="text-sm text-gray-600 truncate">{file.name}</span>}
          </div>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "Enviar Mensagem"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
