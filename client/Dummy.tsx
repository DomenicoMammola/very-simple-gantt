import Button from "@restart/ui/esm/Button";
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { DEFAULT_OPTIONS, Gantt, GanttBar, GanttRow } from "./components";

const dateTimeReviver = function (key: any, value: any) {
  if (typeof value === "string") {
    console.log(value);
    const n = Date.parse(value);
    if (!Number.isNaN(n)) {
      return new Date(n);
    }
  }
  return value;
};

function randomDate(start: Date, end: Date) {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d;
}
function randomBarDate(start: Date) {
  const d = new Date(start.getTime() + (1 + Math.random() * 7) * MILLIS_IN_DAY);
  console.log("start:" + start.toDateString() + " end:" + d.toDateString());
  return d;
}

const MILLIS_IN_DAY = 24 * 3600 * 1000;
class GanttData {
  public experimentId?: number;
  public actionId?: number;
  public originalDurationInMillis: number = 0;
}

export const Dummy: React.FC = () => {
  const startDate = new Date(2021, 9, 1);
  const [ganttData, setGanttData] = useState<GanttViewerProps>({
    startDate: startDate,
    endDate: new Date(2021, 9, 30),
    ...makeOne(startDate),
  });

  return (
    <>
      <Button
        onClick={() =>
          setGanttData({
            startDate: startDate,
            endDate: new Date(2021, 9, 30),
            ...makeOne(startDate),
          })
        }
      >
        Regenerate Data
      </Button>{" "}
      <Button
        onClick={() =>
          setGanttData({
            ...ganttData,
            startDate: new Date(ganttData.startDate.getTime() - MILLIS_IN_DAY),
          })
        }
      >
        &larr;
      </Button>
      START
      <Button
        onClick={() =>
          setGanttData({
            ...ganttData,
            startDate: new Date(ganttData.startDate.getTime() + MILLIS_IN_DAY),
          })
        }
      >
        &rarr;
      </Button>{" "}
      <Button
        onClick={() =>
          setGanttData({
            ...ganttData,
            endDate: new Date(ganttData.endDate.getTime() - MILLIS_IN_DAY),
          })
        }
      >
        &larr;
      </Button>
      END
      <Button
        onClick={() =>
          setGanttData({
            ...ganttData,
            endDate: new Date(ganttData.endDate.getTime() + MILLIS_IN_DAY),
          })
        }
      >
        &rarr;
      </Button>
      <GanttViewer {...ganttData} />
    </>
  );
};

interface GanttViewerProps {
  startDate: Date;
  endDate: Date;
  rows: GanttRow<string>[];
  bars: GanttBar<GanttData>[];
}

const GanttViewer: React.FC<GanttViewerProps> = (props) => {
  var [gantt, setGantt] = useState<Gantt<string, GanttData>>();

  /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */
  const d3Container = useRef<HTMLDivElement>(null);

  /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */
  useEffect(() => {
    console.log("E1");
    var gantt = new Gantt<string, GanttData>(d3Container.current!, {
      ...DEFAULT_OPTIONS,
      rowHeight: 60,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        width: 200,
        style: { "font-size": 10 },
      },
      bars: {
        ...DEFAULT_OPTIONS.bars,
        fontSizes: [11, 11],
        roundness: 4,
      },
    });

    const onEndDrag = (
      bar: GanttBar<GanttData>,
      bars: GanttBar<GanttData>[]
    ): void => {};

    const onDrag = (
      bar: GanttBar<GanttData>,
      newStartTime: Date,
      bars: GanttBar<GanttData>[]
    ): void => {
      bars = JSON.parse(JSON.stringify(bars), (key, v) =>
        key.endsWith("Time") ? new Date(Date.parse(v)) : v
      ); //make a deep clone
      const draggedBarData = bar.data as GanttData;
      console.log(
        "dragging experiment " +
          draggedBarData.experimentId! +
          " action " +
          draggedBarData.actionId!
      );
      const delta = newStartTime.valueOf() - bar.startTime.valueOf();

      const ok = bars.every((b) => {
        const bd = b.data;
        if (
          bd.experimentId! === draggedBarData.experimentId! &&
          bd.actionId! > draggedBarData.actionId!
        ) {
          const tmpEndTime = new Date(b.endTime.valueOf() + delta);
          return !(tmpEndTime > props.endDate);
        } else {
          return true;
        }
      });

      if (!ok) {
        return;
      }

      bars.forEach((b) => {
        const bd = b.data as GanttData;
        if (
          bd.experimentId! === draggedBarData.experimentId! &&
          bd.actionId! >= draggedBarData.actionId!
        ) {
          b.startTime = new Date(b.startTime.valueOf() + delta);
          b.endTime = new Date(b.endTime.valueOf() + delta);
        }
      });

      gantt.doUpdateBars(bars);
    };

    const onResize = (
      resizedBar: GanttBar<GanttData>,
      newEndTime: Date,
      bars: GanttBar<GanttData>[]
    ): void => {
      bars = JSON.parse(JSON.stringify(bars), (key, v) =>
        key.endsWith("Time") ? new Date(Date.parse(v)) : v
      ); //make a deep clone
      //const newBars = JSON.parse(JSON.stringify(bars), dateTimeReviver) as GanttBar[]

      const resizedBarData = resizedBar.data as GanttData;
      console.log(
        "resizing experiment " +
          resizedBarData.experimentId! +
          " action " +
          resizedBarData.actionId!
      );
      const newDuration = newEndTime.getTime() - resizedBar.startTime.getTime();
      if (
        newDuration > resizedBarData.originalDurationInMillis * 1.4 ||
        newDuration < resizedBarData.originalDurationInMillis * 0.6
      ) {
        return;
      } else {
        //resizedBar.endTime = newEndTime
        var t = newEndTime;
        bars
          .sort((b1, b2) => b1.data.actionId! - b2.data.actionId!)
          .forEach((b) => {
            const bd = b.data as GanttData;
            if (bd.experimentId! !== resizedBarData.experimentId!) return;
            if (bd.actionId! > resizedBarData.actionId!) {
              const barDuration = b.endTime.getTime() - b.startTime.getTime();
              b.startTime = t;
              t = new Date(t.getTime() + barDuration);
              b.endTime = t;
            } else if (bd.actionId! === resizedBarData.actionId!) {
              b.endTime = newEndTime;
            }
          });
        gantt.doUpdateBars(bars);
      }
    };

    gantt.onEndDrag = onEndDrag;
    gantt.onDrag = onDrag;
    gantt.onResize = onResize;
    gantt.onTooltip = (bar, tooltipNode) =>
      ReactDOM.render(<div>ciao</div>, tooltipNode);
    setGantt(gantt);
  }, []); //ony once

  useEffect(() => {
    console.log("E2");
    gantt?.setTimeRange(props.startDate, props.endDate);
    gantt?.reload(props.rows, props.bars);
    console.log(props.bars[0]);
  }, [props, gantt]);

  return <div className="very-simple-gantt" ref={d3Container} />;
};

function makeOne(startDate: Date) {
  const rows: GanttRow<string>[] = [];
  const rowNum = 5 + (Math.random() < 0.5 ? 1 : 0);

  for (let i = 0; i < 1; i++) {
    let r: GanttRow<string> = {
      row: i,
      caption: "Machine " + i,
      borderColor: "#006600",
      color: "#00cc00",
      data: i.toString(),
    };
    rows.push(r);
  }

  let expStart = startDate;

  const bars: GanttBar<GanttData>[] = [];
  for (let e = 1; e <= 1; e++) {
    let dateLimit = expStart;

    for (let r = 0; r < rowNum; r++) {
      const data = new GanttData();
      data.experimentId = e;
      data.actionId = r + 1;
      data.originalDurationInMillis = MILLIS_IN_DAY * Math.random() * 7;
      let b: GanttBar<GanttData> = {
        row: r,
        startTime: dateLimit,
        endTime: new Date(dateLimit.getTime() + data.originalDurationInMillis),
        height: 44,
        barColor: d3.interpolateRainbow(Math.random()),
        id: "EXP" + e + "AZZ" + r,
        captions: [
          "EX " + e,
          " ACT" +
            r +
            " ACT" +
            r +
            " ACT" +
            r +
            " ACT" +
            r +
            " ACT" +
            r +
            " ACT" +
            r,
        ],
        draggable: data.actionId === 1,
        resizeble: r === 0 || (r + e) % 2 === 0,
        data: data,
        //opacity: 0.5,
        classes: ["test", `step-${r}`, `exp-${e}`],
      };
      bars.push(b);

      dateLimit = b.endTime;
      if (r === 0) expStart = b.endTime;
    }
  }
  return { rows, bars };
}
