
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
      const newStatus = !isActive;
      setStatusLoading(true);
      try {
        await updateStaff(member.id, undefined, undefined, undefined, newStatus);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Status update failed", error);
        alert("상태 변경에 실패했습니다.");
      } finally {
        setStatusLoading(false);
      }
    }
  };

  const currentColor = isEditing ? editForm.color : member.color;

  return (
    <div className={`
      relative bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm transition-all
      ${isEditing ? 'border-blue-500 ring-1 ring-blue-500 z-10' : 'border-slate-100 dark:border-slate-700 hover:shadow-md'}
      ${!isActive && !isEditing ? 'opacity-60 grayscale-[0.8] bg-slate-50 dark:bg-slate-900' : ''}
    `}>
      {/* Status Toggle (Top Right) */}
      <div className="absolute top-2 right-2 z-20">
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            // Use setTimeout to ensure click registers before blocking operations (if any)
            setTimeout(() => handleToggleStatus(), 10);
          }}
          disabled={statusLoading}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-colors border shadow-sm active:scale-95 cursor-pointer touch-manipulation ${
            isActive 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={isActive ? "클릭하여 퇴사 처리" : "클릭하여 재직 처리"}
        >
          {statusLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            isActive ? <UserCheck size={12} /> : <UserX size={12} />
          )}
          {isActive ? '재직중' : '퇴사'}
        </button>
      </div>

      <div className={`flex items-center gap-4 transition-all duration-200 ${isEditing ? 'mt-8' : 'mt-2'}`}>
        {/* Avatar & Color Picker */}
        <div className="relative group shrink-0 z-10">
          <button 
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner transition-transform active:scale-95 relative overflow-hidden ring-2 ring-offset-2 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-600 cursor-pointer touch-manipulation"
            style={{ backgroundColor: currentColor }}
            title="색상 변경"
          >
            {isEditing ? editForm.name.substring(0, 1) : member.name.substring(0, 1)}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Palette size={16} className="text-white" />
            </div>
          </button>
          
          {/* Color Picker Popover */}
          {showColorPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)}></div>
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
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="이름"
                autoFocus
              />
              <input 
                list={`role-options-${member.id}`}
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="직책"
              />
              <datalist id={`role-options-${member.id}`}>
                {availableRoles.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
                {member.name}
                {!isActive && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">퇴사</span>}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium inline-block truncate max-w-full mt-1">
                {member.role}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - INCREASED Z-INDEX TO 50 and added touch-manipulation */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 relative z-[50]">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={loading}
              className="p-2 relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer touch-manipulation"
              title="취소"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={loading || !editForm.name}
              className="relative flex items-center gap-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer touch-manipulation"
            >
              {loading ? '저장...' : <> <Check size={16} /> 저장 </>}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
              className="p-2 relative text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer touch-manipulation"
              title="수정"
            >
              <Edit2 size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                // Removed setTimeout to fix delete confirm dialog issues on mobile
                onDelete(member);
              }}
              className="p-2 relative text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer touch-manipulation"
              title="삭제"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(StaffItem);
