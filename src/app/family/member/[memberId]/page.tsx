import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import VitalCard from "@/components/dashboard/vital-card";


export default async function FamilyMemberPage({
  params,
}: {
  params: Promise<{
    memberId: string;
  }>;
}) {

  // Auth.js → Only logged-in users
  const session = await auth();


  if (!session?.user?.id) {
    redirect("/signin");
  }


  const { memberId } = await params;

  console.log(
 "Opening family member:",
 memberId
);


  /*
    Family Member Detail

    memberId is the FamilyMember id.

    We first find the actual user connected
    to that family membership.
  */

 const familyMember =
await prisma.familyMember.findFirst({
  where:{
    id: memberId,

    // Security:
    // Only allow members from families
    // where current user belongs.
    family:{
      members:{
        some:{
          userId: session.user.id,
        },
      },
    },
  },

      include:{
        family:true,
        user:{
          select:{
            id:true,
            email:true,

            profile:{
              select:{
                name:true,
              },
            },

            healthMeasurements:{
              orderBy:{
                measuredAt:"desc",
              },

              take:10,
            },

            medicalRecords:{
              where:{
                uploadStatus:"UPLOADED",
              },

              orderBy:{
                createdAt:"desc",
              },

              take:5,
            },
          },
        },
      },
    });



  if(!familyMember){
    redirect("/home");
  }



  const measurements =
    familyMember.user.healthMeasurements;



  const bp =
    measurements.find(
      (m)=>m.type==="BLOOD_PRESSURE"
    );


  const weight =
    measurements.find(
      (m)=>m.type==="WEIGHT"
    );


  const sugar =
    measurements.find(
      (m)=>m.type==="BLOOD_SUGAR"
    );


  const spo2 =
    measurements.find(
      (m)=>m.type==="OXYGEN_SATURATION"
    );



  const memberName =
    familyMember.user.profile?.name ||
    familyMember.user.email.split("@")[0];



  return (

    <main className="min-h-screen bg-slate-50 px-8 py-10">


      {/* Member Header */}

      {/* Family Member Profile Header */}

<section className="rounded-2xl border bg-white p-6 shadow-sm">

  <h1 className="text-3xl font-bold text-slate-900">
    {memberName}
  </h1>

  <p className="mt-2 text-slate-500">
    Family Health Profile
  </p>

  <div className="mt-5 grid gap-4 md:grid-cols-3">

    <div>
      <p className="text-sm text-slate-500">
        Email
      </p>

      <p className="font-medium">
        {familyMember.user.email}
      </p>
    </div>


    <div>
      <p className="text-sm text-slate-500">
        Role
      </p>

      <p className="font-medium">
        {familyMember.role}
      </p>
    </div>


    <div>
      <p className="text-sm text-slate-500">
        Family
      </p>

      <p className="font-medium">
        {familyMember.family.name}
      </p>
    </div>

  </div>

</section>


      {/* Latest Vitals */}

      <section className="mt-6">

        <h2 className="mb-4 text-xl font-semibold">
          Latest Health Data
        </h2>


        <div className="grid gap-4 md:grid-cols-4">


          <VitalCard
            title="Blood Pressure"
            value={
              bp
              ? `${bp.systolic}/${bp.diastolic}`
              : "--"
            }
            unit="mmHg"
            icon="❤️"
          />


          <VitalCard
            title="Weight"
            value={
              weight?.value?.toString() || "--"
            }
            unit="kg"
            icon="⚖️"
          />


          <VitalCard
            title="Sugar"
            value={
              sugar?.value?.toString() || "--"
            }
            unit="mg/dL"
            icon="🩸"
          />


          <VitalCard
            title="SpO₂"
            value={
              spo2?.value?.toString() || "--"
            }
            unit="%"
            icon="🫁"
          />

        </div>

      </section>




      {/* Medical Records */}

      <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold">
          Medical Records
        </h2>


        <div className="mt-5 space-y-3">


        {
          familyMember.user.medicalRecords.length === 0
          ?
          (
            <p className="text-slate-500">
              No medical records available.
            </p>
          )

          :

          familyMember.user.medicalRecords.map(
            (record)=>(
             <div
  key={record.id}
  className="flex items-center justify-between rounded-xl border p-4"
>

  <div>

    <p className="font-medium text-slate-900">
      {record.title}
    </p>

    <p className="text-sm text-slate-500">
      {record.type.replaceAll("_", " ")}
    </p>

  </div>


  <a
    href={`/api/medical-records/${record.id}/view`}
    target="_blank"
    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white"
  >
    View
  </a>

</div>
            )
          )
        }


        </div>


      </section>



    </main>

  );
}