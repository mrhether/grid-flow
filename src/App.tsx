import React from "react";
import _ from "lodash";
import "./App.css";
import { relayoutWidgets } from "./relayoutWidgets";

export const Widget = ({
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
      opacity: showInvisible ? 1 : hidden ? 0 : 1,
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
        <Widget key={index} {...widget} showInvisible={showInvisible}>
          {`${widget.id} ${widget.hidden ? "(gone)" : ""}`}
        </Widget>
      ))}
    </div>
  </div>
);

const App = () => {
  /*   const initialWidgets = [
  { x: 0, y: 0, width: 100, height: 100 },
  { x: 50, y: 50, width: 100, height: 100 },
  { x: 100, y: 0, width: 100, height: 100 },
  { x: 150, y: 50, width: 100, height: 100 },
  { x: 200, y: 0, width: 100, height: 100 },
  { x: 10, y: 80, width: 100, height: 100 },
  { x: 60, y: 130, width: 100, height: 100 },
  { x: 110, y: 80, width: 100, height: 100 },
  { x: 160, y: 130, width: 100, height: 100 },
  { x: 210, y: 80, width: 100, height: 100 }
  ]; */
  const initialWidgets = [
    { x: 0, y: 0, width: 300, height: 37.5, id: "header", hidden: false }, // Header
    { x: 0, y: 40, width: 62.5, height: 200, id: "sidebar", hidden: false }, // Sidebar
    { x: 65, y: 40, width: 200, height: 100, id: "main", hidden: false }, // Main article
    { x: 65, y: 150, width: 200, height: 40, id: "related", hidden: true }, // Related articles
    { x: 65, y: 200, width: 200, height: 75, id: "comments", hidden: false }, // Comments
    { x: 0, y: 240, width: 300, height: 37.5, id: "footer", hidden: false }, // Footer
    { x: 270, y: 45, width: 25, height: 25, id: "fb", hidden: false }, // Floating button (overlap)
    { x: 270, y: 75, width: 25, height: 25, id: "ig", hidden: false }, // Floating button (overlap)
  ];

  /* const [widgets, setWidgets] = React.useState(initialWidgets) */ const widgets =
    relayoutWidgets(_.cloneDeep(initialWidgets));
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <WidgetLayout
          widgets={initialWidgets}
          title="Before"
          showInvisible={true}
        />
        <WidgetLayout widgets={widgets} title="After" showInvisible={false} />
      </div>
    </div>
  );
};

export default App;
