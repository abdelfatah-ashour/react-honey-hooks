import { DownCountDateType } from "../types";

export function calcValeusOfDownCountDate(countDown: any): DownCountDateType{
    // calculate time left
    const days: number = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours: number = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes: number = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds: number = Math.floor((countDown % (1000 * 60)) / 1000);

    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
    };
};
