import { messageError } from "../helper/messageError";
import { DownCountDateType } from "../types";

export function calcValeusOfDownCountDate(
  countDown: number
): DownCountDateType {
  try {
    if (typeof countDown !== "number") {
      throw new Error("Date is not valid");
    }

    if (countDown < 0) {
      throw new Error("Date is not valid");
    }

    // calculate time left
    const days: number = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours: number = Math.floor(
      (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes: number = Math.floor(
      (countDown % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds: number = Math.floor((countDown % (1000 * 60)) / 1000);

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  } catch (error) {
    console.error(messageError(error));
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }
}
