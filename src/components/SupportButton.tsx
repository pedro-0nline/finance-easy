import { BrainCog, Check, Loader2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import ChatComponent from "./ChatComponent";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false); // Corrigido inicializando como false
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          message,
          status: 'open',
          admin_email: 'telhado.folha@gmail.com'
        });

      if (ticketError) throw ticketError;

      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {isChatOpen && <ChatComponent onClose={() => setChatOpen(false)} />} {/* Chat renderizado quando isChatOpen for true */}
      
      <div className="fixed bottom-4 right-4 space-y-2">
        <button
          type="button"
          onClick={() => {
            setChatOpen(true);
            setIsOpen(false);
          }}
          className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700"
        >
          <BrainCog className="h-5 w-5 mr-2" />
          AI
        </button>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Suporte
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Need Help?</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {success ? (
            <div className="p-4">
              <div className="flex items-center justify-center text-green-500 mb-2">
                <Check className="h-6 w-6 mr-2" />
                <span>Ticket submitted successfully!</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How can we help you?
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  required
                  placeholder="Describe your issue..."
                />
              </div>
            
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
