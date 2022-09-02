import { useEffect, useState } from "react";
import { CountDownDateType } from "./types";
import { calcValuesOfDownCountDate } from "./utils/calcValuesOfDownCountDate";

type UseCountdownDateType = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export default function useCountdownDate(date: Date): UseCountdownDateType {
  const parseDate: number = new Date(date).getTime();
  const [countDown, setCountDown] = useState<number>(parseDate - new Date().getTime());
  const { days, hours, minutes, seconds }: CountDownDateType = calcValuesOfDownCountDate(countDown);

  useEffect(() => {
    const downInterval = setInterval(() => {
      setCountDown(parseDate - new Date().getTime());
    }, 1000);

    return () => clearInterval(downInterval);
  }, [parseDate]);

  return {
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
  };
}
