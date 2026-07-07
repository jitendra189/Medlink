import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsService } from '../../services/prescriptions.service';
import { uploadService } from '../../services/upload.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { FileText, Calendar, User, Paperclip, CheckCircle2, Loader2 } from 'lucide-react';

export default function PatientPrescriptionsPage() {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: prescriptionsService.getMy,
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, string>>({});

  async function handleAttach(id: string, file: File) {
    setUploadingId(id);
    try {
      const result = await uploadService.uploadPrescription(file);
      setUploaded((prev) => ({ ...prev, [id]: result.url }));
    } finally {
      setUploadingId(null);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Prescriptions</h1>
        <p className="mt-2 text-surface-500">Your prescription history from all appointments.</p>
      </div>

      {!prescriptions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-surface-300" />
            <p className="font-semibold text-surface-800">No prescriptions yet</p>
            <p className="mt-1 text-sm text-surface-500">Your prescriptions from doctors will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {prescriptions.map((p: any) => {
            const attachedUrl = uploaded[p.id] ?? p.fileUrl;
            const isUploading = uploadingId === p.id;
            return (
              <Card key={p.id} interactive>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    Prescription
                  </CardTitle>
                  <p className="mt-1 flex items-center gap-4 text-xs text-surface-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    {p.doctor?.name && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> Dr. {p.doctor.name}
                      </span>
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  {p.medications?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {p.medications.map((m: any, i: number) => (
                        <span
                          key={i}
                          className="inline-flex flex-col rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs"
                        >
                          <span className="font-semibold text-surface-900">{m.name}</span>
                          <span className="text-surface-500">{m.dosage} • {m.frequency}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-surface-500">No medications listed.</p>
                  )}

                  <div className="mt-4 flex items-center gap-3 border-t border-surface-100 pt-3">
                    {attachedUrl ? (
                      <a
                        href={attachedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Document attached — view
                      </a>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-${p.id}`)?.click()}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline disabled:opacity-70"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                            </>
                          ) : (
                            <>
                              <Paperclip className="h-3.5 w-3.5" /> Attach document
                            </>
                          )}
                        </button>
                        <input
                          id={`file-${p.id}`}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAttach(p.id, file);
                          }}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
