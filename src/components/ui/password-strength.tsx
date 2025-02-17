import { useState, useEffect } from 'react';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Calcular força da senha
    let score = 0;
    const checks = {
      length: password.length >= 8,
      number: /\d/.test(password),
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Pontuação baseada nos critérios
    if (checks.length) score += 20;
    if (checks.number) score += 20;
    if (checks.lower) score += 20;
    if (checks.upper) score += 20;
    if (checks.special) score += 20;

    setStrength(score);

    // Feedback baseado na pontuação
    if (score === 0) {
      setFeedback('Digite sua senha');
    } else if (score <= 20) {
      setFeedback('Muito fraca');
    } else if (score <= 40) {
      setFeedback('Fraca');
    } else if (score <= 60) {
      setFeedback('Média');
    } else if (score <= 80) {
      setFeedback('Forte');
    } else {
      setFeedback('Muito forte');
    }
  }, [password]);

  return (
    <div className="space-y-2">
      <Progress value={strength} className="h-2" />
      <div className="flex justify-between text-xs">
        <p
          className={cn('text-muted-foreground', {
            'text-destructive': strength > 0 && strength <= 20,
            'text-yellow-500': strength > 20 && strength <= 40,
            'text-yellow-600': strength > 40 && strength <= 60,
            'text-emerald-500': strength > 60 && strength <= 80,
            'text-emerald-600': strength > 80,
          })}
        >
          {feedback}
        </p>
        <p className="text-muted-foreground">{strength}%</p>
      </div>
    </div>
  );
}