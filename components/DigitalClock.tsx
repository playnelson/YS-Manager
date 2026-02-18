
import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="flex items-center gap-1 font-mono font-bold text-gray-600 no-invert">
      <ClockIcon size={10} /> {time}
    </span>
  );
};
