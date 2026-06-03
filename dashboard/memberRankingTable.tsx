'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingBadge } from '@/components/shared/RatingBadge';

interface RankingEntry {
  rank: number;
  name: string;
  gender: string;
  final: number;
}

interface MemberRankingTableProps {
  data: RankingEntry[];
}

export function MemberRankingTable({ data }: MemberRankingTableProps) {
  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">Peringkat Kinerja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Peringkat</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Gender</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Skor Akhir</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map((member) => (
                <tr key={member.rank} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      member.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      member.rank === 2 ? 'bg-slate-100 text-slate-600' :
                      member.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {member.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{member.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.gender === 'Laki-laki' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {member.gender === 'Laki-laki' ? '👨' : '👩'} {member.gender}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{member.final}</td>
                  <td className="py-3 px-4">
                    {member.final > 0 ? <RatingBadge score={member.final} /> : <span className="text-slate-400">-</span>}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data anggota
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
