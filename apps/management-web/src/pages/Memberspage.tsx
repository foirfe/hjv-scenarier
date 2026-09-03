import PageHeader from "../components/Pageheader";
export default function MembersPage() {
  return(
    <> <PageHeader
                title="Deltagere"
                description="Opret og administrér deltagere"
                actions={
                  <div>
                    <button>
                        + Tilføj Medlem
                    </button>
                    </div>
                }
            />
    </>
  )
}