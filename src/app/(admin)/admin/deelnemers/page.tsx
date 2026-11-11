import { redirect } from "next/navigation";

// Participants now live in the same list as inquiries.
export default function AdminParticipantsPage() {
  redirect("/admin/aanvragen");
}
