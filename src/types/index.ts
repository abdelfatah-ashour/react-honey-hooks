import { RefObject } from "react";

export interface ParamsType {
  [key: string]: string | number | boolean | undefined;
}

export interface QueryType {
  [key: string]: string | number | boolean;
}

export interface CountDownDateType {
  [key: string]: number;
}

export interface DetectOutsideProps {
  ref: RefObject<HTMLElement>;
  callback: (e: MouseEvent) => void;
}
