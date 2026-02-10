import { useEffect, useRef, useState } from "react";

export default function UserMenu({ user, onRefresh, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = [
    onRefresh
      ? {
          key: "refresh",
          label: "Обновить",
          action: () => {
            onRefresh();
            setOpen(false);
          },
        }
      : null,
    {
      key: "logout",
      label: "Выйти",
      action: () => {
        onLogout?.();
        setOpen(false);
      },
    },
  ].filter(Boolean);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__btn"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="user-menu__name">{user?.username || "user"}</div>
        <div className="user-menu__role">{user?.role}</div>
        <span className="user-menu__chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="user-menu__dropdown">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className="user-menu__item"
              onClick={item.action}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
