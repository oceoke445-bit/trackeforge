import Icon from "@/components/ui/icon";
import { navItems, stats, vehicles } from "@/components/data/fleet";

export default function PlaceholderPage({ title }: { title: string }) {
  const icon = navItems.find((n) => n.label === title)?.icon || "grid";

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS MANAGEMENT</p>
          <h1>{title}</h1>
          <p>Manage and monitor your {title.toLowerCase()} across the organization.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary">
            <Icon name="file" size={16} /> Export
          </button>
          <button className="primary">
            <Icon name="plus" size={17} /> Add {title.replace(/s$/, "")}
          </button>
        </div>
      </div>
      <div className="module-stats">
        {stats.slice(0, 4).map((s, i) => (
          <div className="mini-stat" key={i}>
            <span className={`stat-icon ${s.tone}`}>
              <Icon name={i === 0 ? icon : s.icon} />
            </span>
            <div>
              <small>{i === 0 ? `Total ${title}` : s.label}</small>
              <strong>{s.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="panel management">
        <div className="management-toolbar">
          <div className="global-search">
            <Icon name="search" size={16} />
            <input placeholder={`Search ${title.toLowerCase()}...`} />
          </div>
          <button className="secondary">
            <Icon name="filter" size={15} /> Filters <b>2</b>
          </button>
          <button className="secondary">
            Status: All <Icon name="chevron" size={13} />
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>NAME / ID</th>
              <th>ASSIGNMENT</th>
              <th>STATUS</th>
              <th>CURRENT LOCATION</th>
              <th>LAST UPDATE</th>
              <th>HEALTH</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => (
              <tr key={i}>
                <td>
                  <span className="table-vehicle">
                    <Icon name={icon} size={17} />
                  </span>
                  <strong>{title === "Devices" ? `DEV-0${8274 + i}` : v.name}</strong>
                  <small>{v.plate}</small>
                </td>
                <td>{v.driver}</td>
                <td>
                  <span className={`status ${i === 3 ? "stopped" : "moving"}`}>
                    <i />
                    {i === 3 ? "Offline" : "Online"}
                  </span>
                </td>
                <td>Jakarta Selatan</td>
                <td>{v.update}</td>
                <td>
                  <span className="battery-bar">
                    <i style={{ width: v.battery }} />
                    {v.battery}
                  </span>
                </td>
                <td>
                  <Icon name="more" size={17} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing 1–5 of 1,248 items</span>
          <div>
            <button>Previous</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
