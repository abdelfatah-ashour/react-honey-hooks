import { useEffect, useState } from "react";
import { DownCountDateType } from "./types";
import { calcValeusOfDownCountDate } from "./utils/calcValuesOfDownCountDate";

export default function useCountdownDate(date: Date): DownCountDateType {
    const parseDate: number = new Date(date).getTime();
    const [countDown, setCountDown] = useState<number>(parseDate - new Date().getTime());
    const { days, hours, minutes, seconds }: DownCountDateType = calcValeusOfDownCountDate(countDown);

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
