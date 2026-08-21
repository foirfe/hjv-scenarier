import PageHeader from "../components/Pageheader"
import { useState } from "react";

//DUMMY DATA
type Task = {
  id: string;
  name: string;
  type: string;
  environment: string;
  description: string;
  scenarios: number;
  status: string;
  updatedAt: string;
};
const tasks: Task[] = [
  {
    id: "T-005",
    name: "Observation - ukendt fartøj",
    type: "Observation",
    environment: "Kyst",
    description: "Rapportering og dokumentation ved observation af uidentificeret fartøj.",
    scenarios: 8,
    status: "active",
    updatedAt: "05. apr. 2025",
  },
  {
    id: "T-003",
    name: "Førstehjælp - bevidstløs",
    type: "Procedureøvelse",
    environment: "Maritim",
    description: "Vurdering og behandling af bevidstløs person om bord.",
    scenarios: 7,
    status: "active",
    updatedAt: "12. mar. 2025",
  },
  {
    id: "T-007",
    name: "Havnekontrol - ankerkontrol",
    type: "Tjekliste",
    environment: "Havn",
    description: "Systematisk gennemgang af ankrede fartøjer.",
    scenarios: 0,
    status: "draft",
    updatedAt: "01. mar. 2025",
  },
];
//DUMMY DATA END


export default function TasksPage() {
    const [search, setSearch] = useState("");
    const [environment, setEnvironment] = useState("");
    const [taskType, setTaskType] = useState("");
    const [taskStatus, setTaskStatus] = useState("")

//FILTER OG SØGNING 
const filteredTasks = tasks.filter((task)=>{
    const value = search.toLowerCase();
    
    const matchesSearch =
        task.name.toLowerCase().includes(value) ||
        task.description.toLowerCase().includes(value) ||
        task.environment.toLowerCase().includes(value);

        const matchesEnvironment =
        environment === "" || task.environment === environment;

        const matchesTaskType =
        taskType === "" || task.type === taskType;

        const matchesStatus = 
        taskStatus === "" || task.status === taskStatus;
        
        return matchesSearch && matchesEnvironment && matchesTaskType && matchesStatus;
}
)
    return(
        <div className="tasks-page">
        <PageHeader
            title="Opgaver"
            description="Administrér genanvendelige opgaveskabeloner til øvelsesscenarier"
            actions={
                <>
                <button>Importer Excel</button>
                <button>+ Ny Opgave</button>
                </>
            }
        />
    <section className="tasks-status-tabs">
  <button
    className={status === "" ? "active" : ""}
    onClick={() => setTaskStatus("")}
  >
    Alle opgaver
    <span>{tasks.length}</span>
  </button>

  <button
    className={status === "active" ? "active" : ""}
    onClick={() => setTaskStatus("active")}
  >
    Aktive
    <span>{tasks.filter((task) => task.status === "active").length}</span>
  </button>

  <button
    className={status === "draft" ? "active" : ""}
    onClick={() => setTaskStatus("draft")}
  >
    Kladder
    <span>{tasks.filter((task) => task.status === "draft").length}</span>
  </button>

  <button
    className={status === "archived" ? "active" : ""}
    onClick={() => setTaskStatus("archived")}
  >
    Arkiverede
    <span>{tasks.filter((task) => task.status === "archived").length}</span>
  </button>
</section>

      <section className="tasks-toolbar">
        <input
          type="search"
          placeholder="Søg på navn, beskrivelse eller miljø..."
          value={search}
          onChange={(event)=> setSearch(event.target.value)}
        />

        <select
            value={environment}
            onChange={(event)=> setEnvironment(event.target.value)}
        >
          <option value="">{environment ? "Nulstil filter":"Miljø"}</option>
          <option value="Maritim">Maritim</option>
          <option value="Kyst">Kyst</option>
          <option value="Havn">Havn</option>
        </select>

        <select
            value={taskType}
            onChange={(event)=> setTaskType(event.target.value)}
        >
          <option value="">{taskType ? "Nulstil filter":"Opgavetyper"}</option>
          <option value="Observation">Observation</option>
          <option value="Procedureøvelse">Procedureøvelse</option>
          <option value="Tjekliste">Tjekliste</option>
        </select>
      </section>

      <section className="tasks-content">
            <span>{filteredTasks.length > 1 ?  filteredTasks.length + " resultater" : "1 resultat"}</span>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Navn</th>
              <th>Miljø</th>
              <th>Beskrivelse</th>
              <th>Scenarier</th>
              <th>Status</th>
              <th>Ændret</th>
            </tr>
          </thead>

<tbody>
  {filteredTasks.length > 0 ? (
    filteredTasks.map((task) => (
      <tr key={task.id}>
        <td>{task.id}</td>

        <td>
          <strong>{task.name}</strong>
          <div>{task.type}</div>
        </td>

        <td>{task.environment}</td>
        <td>{task.description}</td>
        <td>{task.scenarios || "—"}</td>
        <td>{task.status}</td>
        <td>{task.updatedAt}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={7}>
        Ingen opgaver matcher dine filtre.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </section>
    </div>
  );
}
