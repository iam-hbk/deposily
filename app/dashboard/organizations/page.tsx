// // import { useState } from "react";
import { createClient } from "@/lib/supabase/server";
// // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquareTextIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationsTable } from "@/components/organizations-table";
// export default async function OrganizationsPage() {
//   const supabase = createClient();
//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();
//   // const [newOrg, setNewOrg] = useState({ name: "", type: "" });
//   // const [inviteEmail, setInviteEmail] = useState("");
//   const { data: organizations, error: org_error } = await supabase
//     .from("organization")
//     .select("*")
//     .eq("created_by", user?.id);

//   // const { data: organizations, isLoading } = useQuery({
//   //   queryKey: ["organizations", user?.id],
//   //   queryFn: async () => {
//   //     const { data, error } = await supabase
//   //       .from("organization")
//   //       .select("*")
//   //       .eq("created_by", user?.id);

//   //     if (error) throw error;
//   //     return data;
//   //   },
//   //   enabled: !!user,
//   // });

//   // const createOrganizationMutation = useMutation({
//   //   mutationFn: async (newOrganization) => {
//   //     const { data, error } = await supabase
//   //       .from("organization")
//   //       .insert([newOrganization])
//   //       .select();

//   //     if (error) throw error;
//   //     return data[0];
//   //   },
//   //   onSuccess: (newOrg) => {
//   //     queryClient.setQueryData(["organizations", user?.id], (old) => [
//   //       ...(old || []),
//   //       newOrg,
//   //     ]);
//   //     setNewOrg({ name: "", type: "" });
//   //     toast({
//   //       title: "Success",
//   //       description: "Organization created successfully",
//   //     });
//   //   },
//   //   onError: () => {
//   //     toast({
//   //       title: "Error",
//   //       description: "Failed to create organization",
//   //       variant: "destructive",
//   //     });
//   //   },
//   // });

//   // const inviteMemberMutation = useMutation({
//   //   mutationFn: async ({ orgId, email }) => {
//   //     const { data, error } = await supabase
//   //       .from("organization_members")
//   //       .insert([
//   //         { organization_id: orgId, user_email: email, role: "member" },
//   //       ]);

//   //     if (error) throw error;
//   //     return data;
//   //   },
//   //   onSuccess: () => {
//   //     toast({
//   //       title: "Success",
//   //       description: `Invited ${inviteEmail} to the organization`,
//   //     });
//   //     setInviteEmail("");
//   //   },
//   //   onError: () => {
//   //     toast({
//   //       title: "Error",
//   //       description: "Failed to invite member",
//   //       variant: "destructive",
//   //     });
//   //   },
//   // });

//   // const handleCreateOrganization = (e) => {
//   //   e.preventDefault();
//   //   createOrganizationMutation.mutate({ ...newOrg, created_by: user?.id });
//   // };

//   // const handleInviteMember = (orgId) => {
//   //   inviteMemberMutation.mutate({ orgId, email: inviteEmail });
//   // };

//   // if (isLoading) return <div>Loading...</div>;

//   return (
//     <div className="container mx-auto py-10">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Organizations</h1>
//       </div>

//       <Card className="mb-6">
//         <CardHeader>
//           <CardTitle>Create New Organization</CardTitle>
//           <CardDescription>
//             Enter the details for your new organization
//           </CardDescription>
//         </CardHeader>
//         <form>
//           <CardContent>
//             <div className="grid gap-4">
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="org-name" className="text-right">
//                   Name
//                 </Label>
//                 <Input
//                   id="org-name"
//                   // value={newOrg.name}
//                   // onChange={(e) =>
//                   //   setNewOrg({ ...newOrg, name: e.target.value })
//                   // }
//                   className="col-span-3"
//                 />
//               </div>
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="org-type" className="text-right">
//                   Type
//                 </Label>
//                 <Input
//                   id="org-type"
//                   // value={newOrg.type}
//                   // onChange={(e) =>
//                   //   setNewOrg({ ...newOrg, type: e.target.value })
//                   // }
//                   className="col-span-3"
//                 />
//               </div>
//             </div>
//           </CardContent>
//           <CardFooter>
//             <Button
//               type="submit"
//               // disabled={createOrganizationMutation.isLoading}
//             >
//               {false
//                 ? // createOrganizationMutation.isPending
//                   "Creating..."
//                 : "Create Organization"}
//             </Button>
//           </CardFooter>
//         </form>
//       </Card>

//       <div className="grid gap-6 mt-6">
//         {organizations?.map((org) => (
//           <Card key={org.id}>
//             <CardHeader>
//               <CardTitle>{org.name}</CardTitle>
//               <CardDescription>{org.type}</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-4">
//                 <div className="grid grid-cols-4 items-center gap-4">
//                   <Label htmlFor={`invite-${org.id}`} className="text-right">
//                     Invite Member
//                   </Label>
//                   <Input
//                     id={`invite-${org.id}`}
//                     type="email"
//                     placeholder="Email address"
//                     // value={inviteEmail}
//                     // onChange={(e) => setInviteEmail(e.target.value)}
//                     className="col-span-3"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter>
//               <Button
//               // onClick={() => handleInviteMember(org.id)}
//               // disabled={inviteMemberMutation.isPending || !inviteEmail}
//               >
//                 {false
//                   ? // inviteMemberMutation.isPending
//                     "Sending..."
//                   : "Send Invitation"}
//               </Button>
//             </CardFooter>
//           </Card>
//         ))}

//         {organizations && organizations?.length < 1 && (
//           <Alert>
//             <MessageSquareTextIcon className="h-4 w-4" />
//             <AlertTitle>Heads up!</AlertTitle>
//             <AlertDescription></AlertDescription>
//           </Alert>
//         )}
//       </div>
//     </div>
//   );
// }

async function getOrganizations(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .or(`created_by.eq.${userId},admins.cs.{${userId}}`);

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }

  return data;
}

export default async function OrganizationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Handle unauthenticated user
    return <div>Please log in to view organizations.</div>;
  }

  const organizations = await getOrganizations(user.id);

  return (
    <div className="container mx-auto py-10 flex flex-col items-center w-full ">
      <div className="flex justify-between items-center mb-6  w-full">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Button size={"sm"} className="self-end" variant={"outline"}>
          <Plus className=" mr-2 h-4 w-4" /> New Organization
        </Button>
      </div>
      <OrganizationsTable data={organizations} />

      {organizations.length === 0 && (
        <Alert className="max-w-md bg-gray-100">
          <MessageSquareTextIcon className="h-4 w-4" />
          <AlertTitle className="font-bold">
            You don't have any organizations yet
          </AlertTitle>
          <AlertDescription className="flex flex-col items-start justify-center space-y-3">
            <p>
              Organizations are a way to group your payers, payments and manage
              your team. This is where your organizations will appear. You do
              not have any organizations yet.
            </p>
            <Button size={"sm"} className="self-end">
              <Plus className=" mr-2 h-4 w-4" /> Create Organization
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
