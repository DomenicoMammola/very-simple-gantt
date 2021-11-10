import { GanttBar } from "./GanttBar";

// must return false if dragging is not allowed for the bar, true if allowed
export interface onGanttStartDragBarEvent { (bar: GanttBar): boolean }
export interface onGanttDragBarEvent { (bar: GanttBar, newStartTime: Date, newEndTime: Date, bars: GanttBar[]): boolean }
export interface onGanttEndDragBarEvent { (bar: GanttBar, bars: GanttBar[]): void }

// must return false if resizing is not allowed for the bar, true if allowed
export interface onGanttStartResizeBarEvent { (resizedBar: GanttBar): boolean }
// must return false if resizing is not allowed for the bar, true if allowed
export interface onGanttResizeBarEvent { (resizedBar: GanttBar, bars: GanttBar[]): boolean }
export interface OnGanttEndResizeBarEvent { (resizedBar: GanttBar, bars: GanttBar[]): void }