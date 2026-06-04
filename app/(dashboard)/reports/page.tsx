'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription as CardDescription } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { reportsApi } from '@/services/reports.api';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { toast } from 'sonner';
import {
  Download, FileText, Loader2, Plus, Trash2, Eye, AlertCircle, X,
} from 'lucide-react';

interface PreviewMember {
  full_name: string;
  avg_ikr: number;
  avg_competency: number;
  avg_final: number;
}

interface PreviewData {
  quarter: number;
  year: number;
  total_members: number;
  avg_ikr: number;
  avg_competency: number;
  avg_final: number;
  rating_distribution: Record<string, number>;
  top_performer: { full_name: string; final_score: number } | null;
  members: PreviewMember[];
}

interface Report {
  id: string;
  title: string;
  quarter: number;
  year: number;
  file_url: string;
  generated_at: string;
  generated_by: string;
}

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [genQuarter, setGenQuarter] = useState<number>(1);
  const [genYear, setGenYear] = useState<number>(new Date().getFullYear());
  const [genTitle, setGenTitle] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRefreshedAt, setPreviewRefreshedAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => { setMounted(true); }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getAll();
      setReports(res.data ?? []);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchReports();
  }, [mounted, fetchReports]);

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewRefreshedAt(null);
    try {
      const res = await reportsApi.preview(genYear, genQuarter);
      const raw = res.data;

      // Hitung distribusi rating dari performance.members
      const ratingDist: Record<string, number> = {};
      const members = raw.performance?.members || [];
      for (const m of members) {
        let rating = 'KURANG';
        if (m.avg_final >= 85) rating = 'SANGAT_BAIK';
        else if (m.avg_final >= 70) rating = 'BAIK';
        else if (m.avg_final >= 55) rating = 'CUKUP';
        ratingDist[rating] = (ratingDist[rating] || 0) + 1;
      }

      // Cari top performer (avg_final tertinggi)
      const sorted = [...members].sort((a, b) => b.avg_final - a.avg_final);
      const top = sorted[0] || null;

      setPreviewData({
        quarter: raw.quarter,
        year: raw.year,
        total_members: raw.performance?.total_entries || members.length,
        avg_ikr: raw.performance?.team_avg_ikr || 0,
        avg_competency: raw.performance?.team_avg_competency || 0,
        avg_final: raw.performance?.team_avg_final || 0,
        rating_distribution: ratingDist,
        top_performer: top ? { full_name: top.member_name, final_score: top.avg_final } : null,
        members: members.map((m: Record<string, unknown>) => ({
          full_name: m.member_name as string,
          avg_ikr: (m.avg_ikr as number) || 0,
          avg_competency: (m.avg_competency as number) || 0,
          avg_final: m.avg_final as number,
        })),
      });
      setPreviewRefreshedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal memuat data preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleGenerate() {
    const title = genTitle.trim() || `Laporan Kinerja Q${genQuarter} ${genYear}`;
    setGenerating(true);
    try {
      await reportsApi.generate({ quarter: genQuarter, year: genYear });
      toast.success('Laporan berhasil dibuat');
      setGenTitle('');
      setPreviewData(null);
      fetchReports();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal membuat laporan');
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }
    setUploading(true);
    try {
      await reportsApi.upload(uploadFile, genQuarter, genYear);
      toast.success('File berhasil diupload');
      setUploadFile(null);
      fetchReports();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Yakin ingin menghapus laporan ini?')) return;
    setDeleting(id);
    try {
      await reportsApi.delete(id);
      toast.success('Laporan berhasil dihapus');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal menghapus laporan');
    } finally {
      setDeleting(null);
    }
  }

  async function handleExportCSV() {
    const data = previewData?.members;
    if (!data || data.length === 0) {
      toast.error('Tidak ada data untuk diekspor. Lakukan preview terlebih dahulu.');
      return;
    }
    setExporting(true);
    try {
      const { unparse } = await import('papaparse');
      const csv = unparse(
        data.map((m) => ({
          Nama: m.full_name,
          'Rata-rata IKR': m.avg_ikr,
          'Rata-rata Kompetensi': m.avg_competency,
          'Rata-rata Final': m.avg_final,
        }))
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preview_Q${genQuarter}_${genYear}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV berhasil diexport');
    } catch {
      toast.error('Gagal mengexport CSV');
    } finally {
      setExporting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const ratingLabel: Record<string, string> = {
    SANGAT_BAIK: 'Sangat Baik',
    BAIK: 'Baik',
    CUKUP: 'Cukup',
    KURANG: 'Kurang',
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-white/10 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-white/10 rounded-xl" />
          <div className="h-48 bg-white/10 rounded-xl" />
        </div>
        <div className="h-64 bg-white/10 rounded-xl" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-white/10 rounded-xl animate-pulse" />
          <div className="h-48 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-white/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--galactic-rose)]/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-[var(--galactic-rose)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--galactic-diamond)]">Gagal Memuat Data</h2>
        <p className="text-[var(--galactic-diamond)]/80 mt-2">{error}</p>
        <Button onClick={fetchReports} className="mt-4 bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]">
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Laporan Kinerja</h2>
          <p className="text-[var(--galactic-diamond)]/80 text-sm mt-1">
            Kelola dan unduh laporan kinerja kuartalan
          </p>
        </div>
      </div>

      {isAdmin && (
        <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
          <GlassCardHeader className="pb-3">
            <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Laporan Baru
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div className="space-y-1.5">
                <Label htmlFor="quarter">Kuartal</Label>
                <select
                  id="quarter"
                  value={genQuarter}
                  onChange={(e) => setGenQuarter(Number(e.target.value))}
                  className="flex h-9 w-20 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>Q{q}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Tahun</Label>
                <select
                  id="year"
                  value={genYear}
                  onChange={(e) => setGenYear(Number(e.target.value))}
                  className="flex h-9 w-24 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="title">Judul Laporan (opsional)</Label>
                <Input
                  id="title"
                  placeholder={`Laporan Kinerja Q${genQuarter} ${genYear}`}
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePreview}
                disabled={previewLoading}
                className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]"
              >
                {previewLoading ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Memuat...</>
                ) : (
                  <><Eye className="mr-1.5 h-4 w-4" /> Preview</>
                )}
              </Button>
            </div>

            {previewLoading && (
              <div className="animate-pulse space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-white/10 rounded-lg" />
                  ))}
                </div>
                <div className="h-40 bg-white/10 rounded-lg" />
              </div>
            )}

            {previewData && !previewLoading && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-[var(--galactic-diamond)] text-sm">
                      Preview — Q{previewData.quarter} {previewData.year}
                    </h4>
                    {previewRefreshedAt && (
                      <span className="text-xs text-[var(--galactic-diamond)]/60">
                        Diperbarui {previewRefreshedAt}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePreview}
                      disabled={previewLoading}
                      title="Refresh preview"
                    >
                      <Loader2 className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewData(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                    <p className="text-xs text-[var(--galactic-diamond)]/80">Total Anggota</p>
                    <p className="text-xl font-bold text-[var(--galactic-diamond)]">{previewData.total_members}</p>
                  </div>
                  <div className="bg-[var(--galactic-aurora)]/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-[var(--galactic-aurora-soft)]">Rata-rata IKR</p>
                    <p className="text-xl font-bold text-[var(--galactic-aurora)]">{previewData.avg_ikr}</p>
                  </div>
                  <div className="bg-[var(--galactic-aurora)]/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-[var(--galactic-aurora-soft)]">Rata-rata Kompetensi</p>
                    <p className="text-xl font-bold text-[var(--galactic-aurora)]">{previewData.avg_competency}</p>
                  </div>
                  <div className="bg-[var(--galactic-emerald)]/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-[var(--galactic-emerald)]">Rata-rata Final</p>
                    <p className="text-xl font-bold text-[var(--galactic-emerald)]">{previewData.avg_final}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-[var(--galactic-diamond)]/80 mb-2">Distribusi Rating</p>
                    <div className="space-y-1.5">
                      {Object.entries(previewData.rating_distribution).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--galactic-diamond)]/80">{ratingLabel[key] || key}</span>
                          <span className="font-semibold text-[var(--galactic-diamond)]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--galactic-diamond)]/80 mb-2">Performa Terbaik</p>
                    {previewData.top_performer ? (
                      <div className="bg-[var(--galactic-amber)]/10 rounded-lg p-3">
                        <p className="font-semibold text-[var(--galactic-diamond)]">{previewData.top_performer.full_name}</p>
                        <p className="text-sm text-[var(--galactic-amber)]">
                          Skor Final: {previewData.top_performer.final_score}
                          {' '}<RatingBadge score={previewData.top_performer.final_score} />
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--galactic-diamond)]/60">Tidak ada data</p>
                    )}
                  </div>
                </div>

                {previewData.members && previewData.members.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--galactic-diamond)]/80 mb-2">
                      Daftar Anggota ({previewData.members.length})
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 font-semibold text-[var(--galactic-diamond)]/80">Nama</th>
                            <th className="text-left py-2 px-3 font-semibold text-[var(--galactic-diamond)]/80">Rata-rata IKR</th>
                            <th className="text-left py-2 px-3 font-semibold text-[var(--galactic-diamond)]/80">Rata-rata Kompetensi</th>
                            <th className="text-left py-2 px-3 font-semibold text-[var(--galactic-diamond)]/80">Rata-rata Final</th>
                            <th className="text-left py-2 px-3 font-semibold text-[var(--galactic-diamond)]/80">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.members.map((m, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="py-2 px-3 font-medium text-[var(--galactic-diamond)]">{m.full_name}</td>
                              <td className="py-2 px-3 text-[var(--galactic-diamond)]/80">{m.avg_ikr}</td>
                              <td className="py-2 px-3 text-[var(--galactic-diamond)]/80">{m.avg_competency}</td>
                              <td className="py-2 px-3 font-semibold text-[var(--galactic-diamond)]">{m.avg_final}</td>
                              <td className="py-2 px-3"><RatingBadge score={m.avg_final} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-4 w-4" />
                    )}
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]"
                  >
                    {generating ? (
                      <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Membuat...</>
                    ) : (
                      <><FileText className="mr-1.5 h-4 w-4" /> Generate PDF</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Laporan */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <h4 className="text-sm font-semibold text-[var(--galactic-diamond)] mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Upload Laporan Manual
              </h4>
              <p className="text-xs text-[var(--galactic-diamond)]/60 mb-3">
                Upload file laporan (PDF, Excel, Word, MD, dll) untuk periode tertentu
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="upload-file">Pilih File</Label>
                  <Input
                    id="upload-file"
                    type="file"
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.md,.csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="h-9 w-60"
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  variant="outline"
                  className="border-[var(--galactic-aurora)]/20 text-[var(--galactic-aurora)] hover:bg-[var(--galactic-aurora)]/10"
                >
                  {uploading ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Mengupload...</>
                  ) : (
                    <><Download className="mr-1.5 h-4 w-4" /> Upload</>
                  )}
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
        <GlassCardHeader className="pb-3">
          <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)]">
            Laporan yang sudah ada
          </GlassCardTitle>
          {reports.length > 0 && (
            <CardDescription>
              {reports.length} laporan tersedia
            </CardDescription>
          )}
        </GlassCardHeader>
        <GlassCardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-[var(--galactic-diamond)]/60" />
              </div>
              <p className="text-[var(--galactic-diamond)]/80 font-medium">Belum ada laporan</p>
              <p className="text-[var(--galactic-diamond)]/60 text-sm mt-1">
                {isAdmin
                  ? 'Gunakan fitur Generate Laporan Baru untuk membuat laporan pertama'
                  : 'Belum ada laporan yang tersedia'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Judul</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Kuartal</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Tahun</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Tanggal Generate</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--galactic-diamond)]">{report.title}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          Q{report.quarter}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[var(--galactic-diamond)]/80">{report.year}</td>
                      <td className="py-3 px-4 text-[var(--galactic-diamond)]/80 text-xs">
                        {formatDate(report.generated_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" title="Download PDF">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleting === report.id}
                              onClick={() => handleDelete(report.id)}
                              title="Hapus laporan"
                            >
                              {deleting === report.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
