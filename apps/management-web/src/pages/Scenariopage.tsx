import PageHeader from "../components/Pageheader";

export default function ScenariosPage() {
    return(
        <>
        <PageHeader
            title="Opgaver"
            description="Administrér genanvendelige opgaveskabeloner til øvelsesscenarier"
            actions={
                <>
                <button>+ Nyt Scenarie</button>
                </>
                    }   
        />
        <div>
            Her vil scenarier komme.
        </div>
        </>
    )
}