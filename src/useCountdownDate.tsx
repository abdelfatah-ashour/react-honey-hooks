import { useEffect, useState } from "react";
import { CountDwonDateType } from "./types";
import { calcValeusOfDownCountDate } from "./utils/calcValuesOfDownCountDate";

type UseCountdownDateType = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export default function useCountdownDate(date: Date): UseCountdownDateType {
  const parseDate: number = new Date(date).getTime();
  const [countDown, setCountDown] = useState<number>(
    parseDate - new Date().getTime()
  );
  const {
    days,
    hours,
    minutes,
    seconds
  }: CountDwonDateType = calcValeusOfDownCountDate(countDown);

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
    seconds: seconds
  };
}
