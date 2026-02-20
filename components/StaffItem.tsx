
import React, { useState } from 'react';
import { Staff } from '../types';
import { Trash2, Edit2, Check, X, Palette, UserCheck, UserX, Loader2 } from 'lucide-react';
import { updateStaff } from '../services/api';
import { STAFF_COLORS } from '../constants/colors';

interface StaffItemProps {
  member: Staff;
  availableRoles: string[];
  onDelete: (staff: Staff) => void;
  onUpdate: (id: string, name: string, role: string, color: string, isActive: boolean) => Promise<void>;
  onRefresh?: () => void;
}

const StaffItem: React.FC<StaffItemProps> = ({ member, availableRoles, onDelete, onUpdate, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: member.name, role: member.role, color: member.color, isActive: member.isActive ?? true });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isActive = isEditing ? editForm.isActive : (member.isActive ?? true);
  const currentColor = isEditing ? editForm.color : member.color;

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditForm({ name: member.name, role: member.role, color: member.color, isActive: member.isActive ?? true });
    setShowColorPicker(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ name: member.name, role: member.role, color: member.color, isActive: member.isActive ?? true });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return;
    setLoading(true);
    await onUpdate(member.id, editForm.name, editForm.role, editForm.color, editForm.isActive);
    setLoading(false);
    setIsEditing(false);
  };

  const handleColorSelect = async (newColor: string) => {
    if (isEditing) {
      setEditForm(prev => ({ ...prev, color: newColor }));
      setShowColorPicker(false);
    } else {
      await updateStaff(member.id, undefined, undefined, newColor);
      setShowColorPicker(false);
      if (onRefresh) onRefresh();
    }
  };

  const handleToggleStatus = async () => {
    if (isEditing) {
      setEditForm(prev => ({ ...prev, isActive: !prev.isActive }));
    } else {
      setStatusLoading(true);
      try {
        await updateStaff(member.id, undefined, undefined, undefined, !isActive);
        if (onRefresh) onRefresh();
      } catch {
        alert("상태 변경에 실패했습니다.");
      } finally {
        setStatusLoading(false);
      }
    }
  };

  return (
    <div className={`
      relative rounded-lg border overflow-hidden transition-all duration-200
      ${isEditing
        ? 'border-blue-400 ring-1 ring-blue-400 bg-white dark:bg-slate-800 shadow-md'
        : isActive
          ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md'
          : 'border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/60 opacity-60'
      }
    `}>
      {/* 상단 컬러 바 */}
      <div className="h-1 w-full" style={{ backgroundColor: currentColor }} />

      <div className="p-3">
        {/* 헤더 행: 아바타 + 이름/직책 + 상태 뱃지 */}
        <div className="flex items-center gap-3 mb-3">

          {/* 아바타 */}
          <div className="relative shrink-0 group z-10">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm transition-transform active:scale-95 relative overflow-hidden ring-2 ring-white dark:ring-slate-800 cursor-pointer touch-manipulation"
              style={{ backgroundColor: currentColor }}
              title="색상 변경"
            >
              {(isEditing ? editForm.name : member.name).substring(0, 1)}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Palette size={13} className="text-white" />
              </div>
            </button>

            {/* 색상 피커 */}
            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-5 gap-1.5 w-[180px] animate-fade-in">
                  {STAFF_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorSelect(c)}
                      className={`w-6 h-6 rounded-full hover:scale-110 transition-transform shadow-sm ${currentColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="col-span-5 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <label className="flex items-center justify-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-blue-500">
                      <span>커스텀</span>
                      <input
                        type="color"
                        className="w-4 h-4 rounded overflow-hidden cursor-pointer"
                        onChange={(e) => handleColorSelect(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 이름 / 직책 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm font-bold bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="이름"
                  autoFocus
                />
                <input
                  list={`role-options-${member.id}`}
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="직책"
                />
                <datalist id={`role-options-${member.id}`}>
                  {availableRoles.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
            ) : (
              <>
                <p className="font-bold text-[15px] text-slate-800 dark:text-slate-100 truncate leading-tight">
                  {member.name}
                </p>
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block"
                  style={{ backgroundColor: currentColor + '22', color: currentColor }}
                >
                  {member.role}
                </span>
              </>
            )}
          </div>

          {/* 재직/퇴사 뱃지 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setTimeout(() => handleToggleStatus(), 10); }}
            disabled={statusLoading}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border transition-colors active:scale-95 cursor-pointer touch-manipulation ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
            }`}
            title={isActive ? "클릭하여 퇴사 처리" : "클릭하여 재직 처리"}
          >
            {statusLoading
              ? <Loader2 size={11} className="animate-spin" />
              : isActive ? <UserCheck size={11} /> : <UserX size={11} />
            }
            {isActive ? '재직' : '퇴사'}
          </button>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {isEditing ? (
            <>
              {/* 편집 모드: 재직/퇴사 토글 */}
              <button
                type="button"
                onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border mr-auto transition-colors ${
                  editForm.isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {editForm.isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                {editForm.isActive ? '재직중' : '퇴사'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={loading || !editForm.name}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? '저장...' : <><Check size={13} />저장</>}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs font-semibold transition-colors cursor-pointer touch-manipulation"
              >
                <Edit2 size={13} />수정
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(member); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs font-semibold transition-colors cursor-pointer touch-manipulation"
              >
                <Trash2 size={13} />삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(StaffItem);
