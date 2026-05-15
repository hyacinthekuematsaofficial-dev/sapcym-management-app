import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Reply, 
  X, 
  CornerDownRight, 
  Smile, 
  Paperclip,
  User as UserIcon,
  MessageSquareOff
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ChatMessage } from '../types';
import { format } from 'date-fns';

export default function AdvancedChat() {
  const { user, member } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chat'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !member) return;

    try {
      await addDoc(collection(db, 'chat'), {
        content: newMessage,
        authorId: user.uid,
        authorName: member.fullName,
        authorAvatar: user.photoURL,
        timestamp: serverTimestamp(),
        replyToId: replyingTo?.id || null,
        replyToContent: replyingTo?.content || null
      });
      setNewMessage('');
      setReplyingTo(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Opening chat...</div>;

  return (
    <div className="h-[calc(100vh-12rem)] bg-white border border-gray-100 rounded-[3rem] shadow-sm flex flex-col overflow-hidden relative">
      <header className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter italic">Ministry Chat</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">Live Conversation • {messages.length} messages</p>
        </div>
        <div className="flex -space-x-3">
          {/* Active members avatars could go here */}
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white" />
          ))}
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gray-50/30"
      >
        <AnimatePresence initial={false}>
          {messages.length > 0 ? messages.map((msg) => (
            <ChatBubble 
              key={msg.id} 
              msg={msg} 
              isOwn={msg.authorId === user?.uid} 
              onReply={() => setReplyingTo(msg)}
            />
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
              <MessageSquareOff size={48} className="mb-4 opacity-20" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 shrink-0 bg-white border-t border-gray-50">
        <form onSubmit={handleSend} className="relative">
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-4 left-0 right-0 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black text-white rounded-lg">
                  <Reply size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Replying to {replyingTo.authorName}</p>
                  <p className="text-xs font-bold line-clamp-1 italic">{replyingTo.content}</p>
                </div>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </motion.div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type your message..."
                className="w-full pl-6 pr-16 py-5 rounded-3xl bg-gray-50 border border-gray-100 outline-none focus:border-black transition-all font-sans"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                <Smile size={20} className="hover:text-black cursor-pointer" />
                <Paperclip size={20} className="hover:text-black cursor-pointer" />
              </div>
            </div>
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-black text-white p-5 rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Send size={24} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ msg, isOwn, onReply }: { msg: ChatMessage, isOwn: boolean, onReply: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}
    >
      <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100 shrink-0 overflow-hidden mt-2">
          {msg.authorAvatar ? <img src={msg.authorAvatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-2.5 text-gray-300" />}
        </div>
        
        <div className="space-y-1">
          {!isOwn && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-2">{msg.authorName}</p>}
          
          <div className="relative group/bubble">
            {/* Reply Label */}
            {msg.replyToId && (
              <div className={`flex items-center gap-2 mb-1 opacity-60 ${isOwn ? 'justify-end' : ''}`}>
                <CornerDownRight size={12} className="text-gray-400" />
                <div className="bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-bold italic truncate max-w-[200px]">{msg.replyToContent}</p>
                </div>
              </div>
            )}

            <div className={`p-5 rounded-3xl text-sm font-sans ${isOwn ? 'bg-black text-white shadow-xl italic rounded-tr-none' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none'}`}>
              {msg.content}
            </div>

            <button 
              onClick={onReply}
              className={`absolute top-0 p-2 bg-white border border-gray-100 rounded-full shadow-lg opacity-0 transition-opacity hover:bg-gray-50 
                ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} group-hover/bubble:opacity-100`}
            >
              <Reply size={14} className="text-gray-500" />
            </button>
          </div>
          
          <p className={`text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest pt-1 px-2 ${isOwn ? 'text-right' : ''}`}>
            {format(msg.timestamp?.toDate() || new Date(), 'HH:mm • MMM dd')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
