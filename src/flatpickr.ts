/**
 * Used library has poor types which forces to import multiple modules separately
 */

import "flatpickr/dist/themes/light.css";

import * as _flatpickr from "flatpickr";
import { FlatpickrFn } from "flatpickr/dist/types/instance";
export const flatpickr: FlatpickrFn = (_flatpickr as unknown) as FlatpickrFn;
