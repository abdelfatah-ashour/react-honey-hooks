<h1><b>🍯 React Honey Hooks</b></h1>
<p>A React Hooks version of the Honey Hooks library</p>

<h3>Hooks available:</h3>
<ul>
  <li>useQuery</li>
  <li>useDownCountDate</li>
</ul>

<h3>Next Hooks</h3>
<ul>
    <li>🔥 useTranslate </li>
    <li>🔥 useMouse </li>
</ul>

<br/>

<h3>Content Table:</h3>
<ul>
  <li><a href="#use-query"></a>useQuery</li>
  <li><a href="#use-down-count-date"></a>useDownCountDate</li>
</ul>

<br/>

<div id="use-query"><h4><b>🍯 useQuery</b></h4></div>
<br/>

```javascript
// First we navigate to the page
// Example: https://example.com?query=value
// Then we use the hook to get the query value

// usage:

// ES5
var useQuery = require("react-honey-hooks").useQuery;
var query = useQuery();
console.log(query); // {query: "value"}

// or

var honey = require("react-honey-hooks")
var query = honey.useQuery();

console.log(query); // {query: "value"}



// ES6
import { useQuery } from "react-honey-hooks";

function Example() {
const { query } = useQuery(); // {query: "value"}

    return (
        <>
            <h3> 🍯 useQury:</h3>
            <p>Query value: {JSON.stringify({ query }, null, 2)}</p>
        </>
    );

}

// TypeScript
import { useQuery, ParamsType } from "react-honey-hooks";

function Example() {
const { query } = useQuery<ParamsType>(); // {query: "value"}

    return (
        <>
            <h3>useQury: 🍯</h3>
            <p>Query value: {JSON.stringify({ query }, null, 2)}</p>
        </>
    );

}

```

<br/>

<div id="use-down-count-date"><h4><b>🍯 useDownCountDate</b></h4></div>
<br/>

```javascript
// usage:

// ES5
var useCountdownDate = require("react-honey-hooks").useCountdownDate;
var dummyDate = Date.now(); // Sat Jul 19 2022 11:09:25 GMT+0200 (Eastern European Standard Time)
var dummyToDay = new Date(date); // Sat Jul 16 2022 11:09:25 GMT+0200 (Eastern European Standard Time)
var countDownDate = useCountdownDate(dummyDate);
console.log(countDownDate); // dummy output {days: 2, hours: 23, minutes: 59, seconds: 59}

// or

var honey = require("react-honey-hooks");
var dummyDate = Date.now(); // Sat Jul 19 2022 11:09:25 GMT+0200 (Eastern European Standard Time)
var dummyToDay = new Date(date); // Sat Jul 16 2022 11:09:25 GMT+0200 (Eastern European Standard Time)
var countDownDate = honey.useCountdownDate(dummyDate);
console.log(countDownDate); // dummy output {days: 2, hours: 23, minutes: 59, seconds: 59}

// ES6
import { useCountdownDate } from "react-honey-hooks";

function Example() {
    const { days, hours, minutes, seconds } = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}

    return (
        <>
            <h3> 🍯 useCountdownDate:</h3>
            <p>DownCount Date value: {JSON.stringify({ days, hours, minutes, seconds }, null, 2)}</p>
        </>
    );
}

// TypeScript
import { useCountdownDate, DownCountDateType } from "react-honey-hooks";

function Example() {
    const { days, hours, minutes, seconds }: DownCountDateType = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}

    return (
        <>
            <h3> 🍯 useCountdownDate:</h3>
            <p>DownCount Date value: {JSON.stringify({ days, hours, minutes, seconds }, null, 2)}</p>
        </>
    );
}
```
