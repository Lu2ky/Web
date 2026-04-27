import {use, useEffect, useId, useRef, useState} from "react";

function isControlled(open) {
    return typeof open === "boolean";
}

export default function DropdownBase({
    open,
    defaultOpen = false,
    onOpenChange,
    coloseOnOutsideClick = true,
    closeOnEscape = true,
    closeOnSelect = true,
    roleMode = "menu",
    className = "",
    menuClassName = "",
    trigger,
    children,
}) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const id = useId();

    const currentOpen = isControlled(open) ? open : internalOpen;

    const setOpen = (next, reason) => {
        if (!isControlled(open)) setInternalOpen(next);
        onOpenChange?.(next, reason);
    };

    const toggle = () => setOpen(!currentOpen, "trigger");
    const close = (reason = "programmatic") => setOpen(false, reason);

    useEffect(() => {
        if (!currentOpen) return;

        const onDocMouseDown = (e) => {
            if (!coloseOnOutsideClick) return;
            if (!rootRef.current?.contains(e.target)) {
                close("outside-click");
            }
        };

        const onDocKeyDown = (e) => {
            if (e.key === "Escape" && closeOnEscape) {
                e.preventDefault();
                close("escape");
                buttonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onDocKeyDown);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onDocKeyDown);
        };
    }, [currentOpen, coloseOnOutsideClick, closeOnEscape]);

    const roleByMode = roleMode === "listbox" ? "listbox" : roleMode === "menu" ? "menu" : undefined;

    return (
        <div ref={rootRef} className={className}>
            {trigger({
                ref: buttonRef,
                isOpen: currentOpen,
                "aria-haspopup": roleByMode === "panel" ? "dialog" : "menu",
                "aria-expanded": currentOpen,
                "aria-controls": 'dropdowwn-${id}',
            })}

            {currentOpen && (
                <div
                    id={'dropdown-${id}'}
                    ref={menuRef}
                    className={menuClassName}
                    role={roleByMode}
                >
                    {children({
                        isOpen: currentOpen,
                        close,
                        select: () => {
                            if(closeOnSelect) close("select");
                        },
                    })}
                </div>
            )}    
        </div>
    );

}