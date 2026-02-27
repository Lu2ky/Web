import React, { useEffect, useState } from "react";

function BaseBlock({
    children,
    background_color,
    style={},
    onClick,
}) {
    const [mounted, setMounted]=useState(false);
    useEffect(()=>{
        const id = setTimeout(()=>setMounted(true), 10);
        return()=>clearTimeout(id);
    }, []);

    return (
        <div
            className={"activity-card"+(mounted ? " enter" : "")}
            style={{ ...style, backgroundColor: background_color }}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

export default BaseBlock;