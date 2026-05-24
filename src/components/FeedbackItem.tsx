import React, { useState } from 'react';
import { UserFeedback } from '../supabase';
import { ThumbsUp, MessageSquare, AlertTriangle, Lightbulb, CheckSquare, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface FeedbackItemProps {
  feedback: UserFeedback;
  onVote: (id: string, currentUpvotes: number) => Promise<void>;
}

export const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = async () => {
    if (isVoting || hasVoted || !feedback.id) return;
    setIsVoting(true);
    try {
      await onVote(feedback.id, feedback.upvotes);
      setHasVoted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            IMPLEMENTADO
          </span>
        );
      case 'investigating':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            EM INVESTIGAÇÃO
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            ARQUIVADO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/25">
            AGUARDANDO REVISÃO
          </span>
        );
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'bug':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          bgColor: 'bg-rose-500/10',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-500/20',
          label: 'Relatar Bug'
        };
      case 'suggestion':
        return {
          icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/20',
          label: 'Sugestão'
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4 text-zinc-400" />,
          bgColor: 'bg-zinc-800',
          textColor: 'text-zinc-350',
          borderColor: 'border-zinc-700/60',
          label: 'Geral'
        };
    }
  };

  const style = getTypeStyle(feedback.type);
  const formattedDate = feedback.created_at
    ? new Date(feedback.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: 'numeric',
        minute: '2-digit'
      })
    : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-5 bg-[#1F1F24] border border-zinc-800 rounded-xl hover:border-zinc-700 transition duration-150 flex flex-col md:flex-row gap-4 items-start justify-between"
    >
      <div className="space-y-3 flex-1">
        {/* Author metadata panel */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-100 text-sm">
            @{feedback.nickname || 'Anônimo'}
          </span>

          <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
            {style.icon}
            {style.label}
          </span>

          {getStatusBadge(feedback.status)}

          {feedback.version_affected && (
            <span className="text-[11px] font-mono text-zinc-500">
              afeta: {feedback.version_affected}
            </span>
          )}

          {formattedDate && (
            <span className="text-[11px] text-zinc-650 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formattedDate}
            </span>
          )}
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-serif lg:font-sans">
          "{feedback.content}"
        </p>
      </div>

      <div className="shrink-0 flex items-center md:flex-col gap-2 mt-2 md:mt-0 self-end md:self-center">
        <button
          onClick={handleVote}
          disabled={hasVoted || isVoting}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition duration-150 ${
            hasVoted
              ? 'bg-springfield-yellow/10 text-springfield-yellow border border-springfield-yellow/30'
              : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700/60 cursor-pointer'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''} ${isVoting ? 'animate-bounce' : ''}`} />
          <span>Votar ({feedback.upvotes + (hasVoted ? 1 : 0)})</span>
        </button>
      </div>
    </motion.div>
  );
};
