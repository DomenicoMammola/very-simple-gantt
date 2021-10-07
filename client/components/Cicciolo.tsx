import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttBar } from './GanttBar'
import { Gantt } from './Gantt'
import { GanttRow } from './GanttRow';

function randomDate(start: Date, end: Date) {
    var d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    // console.log("start:" + start + " end:" + end + " date:" + d);
    return d;

  }

export const Cicciolo: React.FC = () => {    

    /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */    
    const d3Container = useRef(null);    
    

    /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */    
    useEffect(() => {        
        const gantt = new Gantt(d3Container); 
        gantt.startDate = new Date(2021, 9, 1);
        gantt.endDate = new Date(2021, 9, 30);

        for (let i = 0; i < 6; i++) {
            let r = new GanttRow;
            r.row = i;
            r.caption = 'CAZZILLATORE ' + i;
            gantt.rows.push(r);
        }

        for (let r = 0; r < 6; r ++)
        {
            let dateLimit = gantt.startDate;

            for (let i = 0; i < 4; i++) {
                let b = new GanttBar;
                b.row = r;
                b.startTime = randomDate(dateLimit, gantt.endDate); //randomDate(gantt.startDate, gantt.endDate);
                b.endTime = randomDate(b.startTime, gantt.endDate);
                dateLimit = b.endTime;
                b.height = 70;
                b.barColor = d3.interpolateRainbow(Math.random());
                b.caption = "bar #" + i;
                gantt.bars.push(b);
            }
    
        }

        gantt.init();       

        const updateChart = () => {
            gantt.loadBars();
        }

        updateChart();
    })

    return  <div id="cicciolo" ref={d3Container} />
    
}
