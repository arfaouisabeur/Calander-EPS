import React, { useState, useEffect } from "react";
import Papa from "papaparse";

const maleIconUrl = "https://cdn-icons-png.flaticon.com/512/727/727399.png"; const femaleIconUrl = "https://cdn-icons-png.flaticon.com/512/727/727393.png";

function App() {
  const [dataByDate, setDataByDate] = useState({});
  const [uniqueYearMonths, setUniqueYearMonths] = useState([]);
  const [selectedYMIndex, setSelectedYMIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  useEffect(() => {
    const sheetUrl =
      "https://docs.google.com/spreadsheets/d/1M9omJunSboUxKNKiP1MYD7YxP2qhAZQq0Yy_cTeyjjI/gviz/tq?tqx=out:csv&sheet=Calendar";

    fetch(sheetUrl)
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: results => {
            const rows = results.data;
            const map = {};
            const ymSet = new Set();

            rows.forEach(row => {
              const dateStr = row["Date"];
              if (!dateStr) return;

              const dateObj = new Date(dateStr);
              if (isNaN(dateObj)) return;

              const isoDate = dateObj.toISOString().split("T")[0];
              map[isoDate] = {
                totalPersons: row["Total Persons"] || "",
                males: row["Males"] || "",
                females: row["Females"] || ""
              };

              ymSet.add(`${dateObj.getFullYear()}-${dateObj.getMonth()}`);
            });

            const ymArray = Array.from(ymSet).map(v => {
              const [y, m] = v.split("-");
              return { year: +y, month: +m };
            });
            ymArray.sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.month - b.month;
            });

            setDataByDate(map);
            setUniqueYearMonths(ymArray);
            setLoading(false);
          }
        });
      })
      .catch(err => {
        console.error("Error fetching CSV:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }
  if (!uniqueYearMonths.length) {
    return <div className="loading">No data found!</div>;
  }

  function generateMonthMatrix(y, m) {
    const weeks = [];
    const firstOfMonth = new Date(y, m, 1);
    const startDay = firstOfMonth.getDay(); 
    let current = new Date(y, m, 1 - startDay);
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  function getBackgroundColorForTotal(totalString) {
    const total = parseInt(totalString, 10) || 0;
    if (total <= 0) return "#fdfdfd"; 
    const ratio = Math.min(total / 100, 1);
    const baseColor = [255, 204, 204]; // #ffcccc
    const highColor = [255, 68, 68];   // #ff4444

    const r = Math.round(baseColor[0] + (highColor[0] - baseColor[0]) * ratio);
    const g = Math.round(baseColor[1] + (highColor[1] - baseColor[1]) * ratio);
    const b = Math.round(baseColor[2] + (highColor[2] - baseColor[2]) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  const currentYM = uniqueYearMonths[selectedYMIndex];
  const { year, month } = currentYM;
  const monthMatrix = generateMonthMatrix(year, month);

  return (
    <div className="calendarCard">
      <h1 style={{ marginTop: 0 }}>Arrivals Calendar</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "0.5rem", fontWeight: "bold" }}>
          Select Month:
        </label>
        <select
          style={{
            padding: "0.4rem 0.6rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            outline: "none",
            cursor: "pointer"
          }}
          value={selectedYMIndex}
          onChange={(e) => setSelectedYMIndex(+e.target.value)}
        >
          {uniqueYearMonths.map(({ year, month }, idx) => (
            <option key={`${year}-${month}`} value={idx}>
              {monthNames[month]} {year}
            </option>
          ))}
        </select>
      </div>

      <h2 style={{ marginBottom: "1rem", fontSize: "1.4rem" }}>
        {monthNames[month]} {year}
      </h2>

      <table className="calendarTable">
        <thead>
          <tr>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((dow) => (
              <th key={dow} className="calendarHeader">
                {dow}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthMatrix.map((week, wIndex) => (
            <tr key={wIndex}>
              {week.map((day, dIndex) => {
                const iso = day.toISOString().split("T")[0];
                const inThisMonth = day.getMonth() === month;
                const dayData = dataByDate[iso];
                const totalVal = dayData?.totalPersons || "";
                const cellBg = getBackgroundColorForTotal(totalVal);

                return (
                  <td
                    key={dIndex}
                    className="calendarCell"
                    style={{
                      backgroundColor: cellBg,
                      color: inThisMonth ? "#000000" : "#999999"
                    }}
                  >
                    <div className="dateNumber">{day.getDate()}</div>

                    {dayData && (
                      <div className="dayData">
                        <div className="totalRow">
                          <span className="totalLabel">Total:</span>
                          <span className="totalValue">{dayData.totalPersons}</span>
                        </div>
                        <div className="genderRow">
                          <div className="genderContainer">
                            <img
                              className="genderIcon"
                              src={maleIconUrl}
                              alt="Male"
                            />
                            <span>{dayData.males}</span>
                          </div>
                          <div className="genderContainer">
                            <img
                              className="genderIcon"
                              src={femaleIconUrl}
                              alt="Female"
                            />
                            <span>{dayData.females}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
