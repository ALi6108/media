'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { eventsApi } from '@/services/events.api';
import { toast } from 'sonner';
import { Plus, Calendar, Loader2, Save, AlertCircle, Filter, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAfter, isSameDay, parseISO, getISOWeek, getISOWeekYear } from 'date-fns';

interface EventData {
  id: string;
  title: string;
  description: string;
  event_type: 'LIPUTAN' | 'KEGIATAN_RUTIN' | 'HARI_BESAR' | 'RAPAT' | 'LAINNYA';
  event_date: string;
  period_week: number;
  period_year: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type EventStatus = 'upcoming' | 'ongoing' | 'completed';

const eventTypeStyles: Record<string, string> = {
  LIPUTAN: 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)]',
  KEGIATAN_RUTIN: 'bg-[var(--galactic-amber)]/10 text-[var(--galactic-amber)]',
  HARI_BESAR: 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)]',
  RAPAT: 'bg-teal-500/10 text-teal-400',
  LAINNYA: 'bg-white/[0.03] text-[var(--galactic-diamond)]/80',
};

const eventTypeLabels: Record<string, string> = {
  LIPUTAN: 'Liputan',
  KEGIATAN_RUTIN: 'Kegiatan Rutin',
  HARI_BESAR: 'Hari Besar',
  RAPAT: 'Rapat',
  LAINNYA: 'Lainnya',
};

const statusConfig: Record<EventStatus, { label: string; color: string; dotColor: string }> = {
  upcoming: {
    label: 'Mendatang',
    color: 'bg-[var(--galactic-aurora)]/100/15 text-[var(--galactic-aurora)] ring-[var(--galactic-aurora)]/20',
    dotColor: 'bg-[var(--galactic-aurora)]/100',
  },
  ongoing: {
    label: 'Sedang Berlangsung',
    color: 'bg-[var(--galactic-emerald)]/100/15 text-[var(--galactic-emerald)] ring-emerald-500/20',
    dotColor: 'bg-[var(--galactic-emerald)]/100',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-white/[0.02] text-[var(--galactic-diamond)]/80 ring-white/10',
    dotColor: 'bg-white/40',
  },
};

function getEventStatus(eventDate: string): EventStatus {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = parseISO(eventDate);
  const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (isSameDay(eventStart, todayStart)) return 'ongoing';
  if (isAfter(eventStart, todayStart)) return 'upcoming';
  return 'completed';
}

const createEventSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  description: z.string().optional(),
  event_date: z.string().min(1, 'Tanggal harus diisi'),
  event_type: z.enum(['LIPUTAN', 'KEGIATAN_RUTIN', 'HARI_BESAR', 'RAPAT', 'LAINNYA']),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { selectedYear, setYear } = useFilterStore();
  const isAdmin = user?.role === 'ADMIN';

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: '', description: '', event_date: '', event_type: 'LIPUTAN' },
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (createOpen) form.reset();
  }, [createOpen, form]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsApi.getAll({ year: selectedYear });
      setEvents(res.data ?? []);
    } catch {
      toast.error('Gagal memuat data events');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (mounted) fetchEvents();
  }, [fetchEvents, mounted]);

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Hapus event "${title}"?`)) return;
    try {
      await eventsApi.delete(id);
      toast.success('Event berhasil dihapus');
      fetchEvents();
    } catch {
      toast.error('Gagal menghapus event');
    }
  };

  const onSubmit = async (data: CreateEventForm) => {
    setSubmitting(true);
    try {
      const eventDate = parseISO(data.event_date);
      await eventsApi.create({
        ...data,
        period_week: getISOWeek(eventDate),
        period_year: getISOWeekYear(eventDate),
      });
      toast.success('Event berhasil dibuat');
      setCreateOpen(false);
      form.reset();
      fetchEvents();
    } catch {
      toast.error('Gagal membuat event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white/10 rounded-xl" />
        ))}
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Events & Kegiatan</h2>
          <p className="text-[var(--galactic-diamond)]/80 text-sm mt-1">
            {events.length} kegiatan tercatat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--galactic-diamond)]/60" />
            <select
              value={selectedYear}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-[var(--galactic-diamond)] focus:outline-none focus:ring-2 focus:ring-[var(--galactic-aurora)]/20"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Event
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Event Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input id="title" {...form.register('title')} placeholder="Nama event" />
                    {form.formState.errors.title && (
                      <p className="text-xs text-[var(--galactic-rose)] flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      {...form.register('description')}
                      placeholder="Deskripsi event (opsional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Tanggal</Label>
                    <Input id="event_date" type="date" {...form.register('event_date')} />
                    {form.formState.errors.event_date && (
                      <p className="text-xs text-[var(--galactic-rose)] flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {form.formState.errors.event_date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Tipe Event</Label>
                    <select
                      id="event_type"
                      {...form.register('event_type')}
                      className="h-8 w-full rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-[var(--galactic-diamond)] focus:outline-none focus:ring-2 focus:ring-[var(--galactic-aurora)]/20"
                    >
                      {Object.entries(eventTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Simpan
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1 h-28 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-12 w-12 text-[var(--galactic-diamond)]/60 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--galactic-diamond)]">Belum ada kegiatan</h3>
          <p className="text-sm text-[var(--galactic-diamond)]/80 mt-1">
            Belum ada event atau kegiatan untuk tahun {selectedYear}.
          </p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-6">
            {sorted.map((event) => {
              const status = getEventStatus(event.event_date);
              const st = statusConfig[status];
              const isOngoing = status === 'ongoing';
              return (
                <div key={event.id} className="relative flex gap-6 pl-0">
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ring-4 ring-white ${
                        isOngoing
                          ? 'bg-[var(--galactic-emerald)]/100'
                          : status === 'upcoming'
                            ? 'bg-[var(--galactic-aurora)]/100'
                            : 'bg-white/[0.08]'
                      }`}
                    >
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <GlassCard
                    className={`flex-1 shadow-[0_0_15px_rgba(255,255,255,0.05)] border transition-all duration-200 hover:shadow-md ${
                      isOngoing
                        ? 'border-[var(--galactic-emerald)]/20 bg-[var(--galactic-emerald)]/10/30'
                        : 'border-white/10'
                    }`}
                  >
                    <GlassCardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-[var(--galactic-diamond)]">
                                {event.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-xs ring-1 ${st.color}`}
                              >
                                {st.label}
                              </Badge>
                              <Badge
                                className={`text-xs ${
                                  eventTypeStyles[event.event_type] ||
                                  'bg-white/[0.03] text-[var(--galactic-diamond)]/80'
                                }`}
                              >
                                {eventTypeLabels[event.event_type] || event.event_type}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-[var(--galactic-diamond)]/80">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-[var(--galactic-diamond)]/60">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {event.event_date}
                              </span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="p-2 text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-rose)] hover:bg-[var(--galactic-rose)]/10 rounded-lg transition-colors flex-shrink-0"
                              title="Hapus event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
