type UpcomingAppointment = {
  id: string;
  hospitalName: string;
  doctorName: string | null;
  hospitalAddress: string | null;
  appointmentDate: Date;

  patient: {
    email: string;
    profile: {
      name: string | null;
    } | null;
  };
};

type UpcomingAppointmentsProps = {
  appointments: UpcomingAppointment[];
};

export default function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      {/* [Dashboard → Upcoming Appointments]
          Displays the nearest family healthcare appointments. */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Appointments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your family&apos;s next healthcare visits.
          </p>
        </div>

        {/* [Dashboard → Appointment Navigation]
            Opens the complete appointment management page. */}
        <a
          href="/appointments"
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          View all
        </a>
      </div>

      {appointments.length === 0 ? (
        /* [Appointments → Empty State] */
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium text-slate-700">
            No upcoming appointments
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Add an appointment to keep track of healthcare visits.
          </p>
        </div>
      ) : (
        /* [Appointments → Appointment List] */
        <div className="divide-y">
          {appointments.map((appointment) => {
            const patientName =
              appointment.patient.profile?.name ||
              appointment.patient.email.split("@")[0];

            return (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                {/* Appointment information */}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {appointment.hospitalName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Patient: {patientName}
                  </p>

                  {appointment.doctorName && (
                    <p className="mt-1 text-sm text-slate-500">
                      Doctor: {appointment.doctorName}
                    </p>
                  )}
                </div>

                {/* Appointment date and time */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-teal-700">
                    {appointment.appointmentDate.toLocaleDateString()}
                  </p>

                  <p className="text-sm text-slate-500">
                    {appointment.appointmentDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}