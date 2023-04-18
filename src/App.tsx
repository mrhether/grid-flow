import React, { useState } from "react";
import _ from "lodash";
import "./App.css";
import { Widget, relayoutWidgets } from "./relayoutWidgets";

export const WidgetComp = ({
  x,
  y,
  width,
  height,
  backgroundColor,
  hidden,
  showInvisible,
  children,
}: any) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y + 64,
      width,
      height,
      backgroundColor: "#11111111",
      opacity: showInvisible ? 1 : hidden ? 0.1 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid black",
    }}
  >
    {children}
  </div>
);

const WidgetLayout = ({ widgets, title, showInvisible }: any) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      border: "1px solid grey",
      margin: "16px",
    }}
  >
    <h3>{title}</h3>
    <div>
      {widgets.map((widget: any, index: any) => (
        <WidgetComp key={index} {...widget} showInvisible={showInvisible}>
          {`${widget.id} ${widget.hidden ? "(gone)" : ""}`}
        </WidgetComp>
      ))}
    </div>
  </div>
);

const App = () => {
  const [beforeWidgets, setWidgets] = useState<Widget[]>([
    { x: 0, y: 0, width: 300, height: 37.5, id: "header", hidden: true }, // Header
    { x: 0, y: 40, width: 62.5, height: 200, id: "sidebar", hidden: false }, // Sidebar
    { x: 65, y: 40, width: 200, height: 100, id: "main", hidden: true }, // Main article
    { x: 65, y: 150, width: 200, height: 40, id: "related", hidden: false }, // Related articles
    { x: 65, y: 200, width: 200, height: 175, id: "comments", hidden: false }, // Comments
    { x: 0, y: 300, width: 300, height: 37.5, id: "footer", hidden: false }, // Footer
    { x: 270, y: 45, width: 25, height: 25, id: "fb", hidden: false }, // Floating button (overlap)
    { x: 270, y: 75, width: 25, height: 25, id: "ig", hidden: false }, // Floating button (overlap)
  ]);

  let afterWidgets = beforeWidgets;
  try {
    afterWidgets = relayoutWidgets(_.cloneDeep(beforeWidgets));
  } catch (e) {
    afterWidgets = [];
    console.log(e);
  }

  return (
    <div>
      <h1>Control Visibility</h1>
      <div style={{ display: "flex", gap: 8, padding: 16 }}>
        {beforeWidgets.map((widget, index) => (
          <div key={index}>
            <label>{widget.id}</label>
            <input
              type="checkbox"
              checked={widget.hidden}
              onChange={(e: any) => {
                const newWidgets = _.cloneDeep(beforeWidgets);
                newWidgets[index].hidden = e.target.checked;
                setWidgets(newWidgets);
              }}
            />
          </div>
        ))}
      </div>
      <h1>Layout</h1>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <WidgetLayout
          widgets={beforeWidgets}
          title="Before"
          showInvisible={true}
        />
        <WidgetLayout
          widgets={afterWidgets}
          title="After"
          showInvisible={false}
        />
      </div>
    </div>
  );
};

export default App;
