/**
 * Comentarios del detalle de asignatura.
 *
 * Mantiene el estado del popup y las operaciones de comentarios con actualización
 * optimista. Los identificadores llegan normalizados desde el calendario.
 */

import { useEffect, useState } from "react";
import fetchComments from "../api/commentFetcher";
import addComment from "../api/addComentService";
import updateComment from "../api/updateComentService";
import deleteComment from "../api/removeComentService";

export function useClassComments({ isOpen, classData, userId, onClose }) {
  const [is_open, set_is_open] = useState(isOpen);
  const [comments, set_comments] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const commentCourseId = classData?.id ?? classData?.course_id ?? classData?.nrc;
  const commentScheduleId = classData?.scheduleId ?? classData?.schedule_id ?? null;
  const commentUserId = userId ?? classData?.userId ?? classData?.user_id ?? null;

  useEffect(() => {
    set_is_open(isOpen);
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("onboarding:official-card-opened"));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi)
        ? event.detail.allowOpenUi
        : [];
      if (!allowOpenUi.includes("modal-official-card")) {
        set_is_open(false);
        onClose();
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () =>
      window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, [onClose]);

  useEffect(() => {
    set_comments([]);
    setReloadKey((k) => k + 1);
  }, [classData?.id, classData?.nrc]);

  useEffect(() => {
    const shouldFetch = is_open && commentUserId && (commentCourseId || commentScheduleId);
    if (!shouldFetch) {
      set_comments([]);
      return;
    }

    let isCancelled = false;

    const loadComments = async () => {
      try {
        const loaded = await fetchComments({
          userId: commentUserId,
          courseId: commentCourseId,
          scheduleId: commentScheduleId,
        });
        if (!isCancelled) set_comments(loaded);
      } catch (error) {
        console.error("Error al cargar comentarios:", error);
      }
    };

    loadComments();

    return () => {
      isCancelled = true;
    };
  }, [is_open, commentUserId, commentCourseId, commentScheduleId, reloadKey]);

  const handle_close = () => {
    set_is_open(false);
    onClose();
  };

  const handle_add_comment = async (comment_text) => {
    const courseId = commentCourseId;
    const scheduleId = commentScheduleId ?? courseId;

    if (!courseId || !scheduleId) {
      throw new Error("Cannot add comment: missing courseId/scheduleId");
    }
    if (!commentUserId) {
      throw new Error("Cannot add comment: userId is missing");
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      text: comment_text,
      timestamp: "Ahora",
    };

    setIsAddingComment(true);
    set_comments((prev) => [optimisticComment, ...prev]);

    try {
      const result = await addComment({
        scheduleId,
        userId: commentUserId,
        courseId,
        courseName: classData?.subject_name || "",
        comment: comment_text,
      });

      const wait = (ms) =>
        new Promise((resolve) => {
          window.setTimeout(resolve, ms);
        });

      let found = false;
      let lastLoaded = [];

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const loaded = await fetchComments({
            userId: commentUserId,
            courseId,
            scheduleId,
          });
          lastLoaded = loaded;

          const expected = String(comment_text).trim().toLowerCase();
          found = loaded.some(
            (comment) => String(comment?.text ?? "").trim().toLowerCase() === expected
          );
          if (found) set_comments(loaded);
          if (found) break;
        } catch (reloadError) {
          console.error("Error recargando comentarios tras guardar:", reloadError);
        }

        await wait(300);
      }

      if (!found) {
        set_comments((prev) => {
          const withoutOptimistic = prev.filter((comment) => comment.id !== optimisticId);
          if (lastLoaded.length > 0) return [optimisticComment, ...lastLoaded];
          return withoutOptimistic;
        });
      }

      setReloadKey((k) => k + 1);
      return result;
    } catch (err) {
      set_comments((prev) => prev.filter((comment) => comment.id !== optimisticId));
      console.error("Error añadiendo comentario:", err);
      throw err;
    } finally {
      setIsAddingComment(false);
    }
  };

  const handle_delete_comment = async (comment_id) => {
    if (savingCommentId !== null || deletingCommentId !== null) return;

    const previousComments = comments;
    setDeletingCommentId(comment_id);
    set_comments((prev) => prev.filter((comment) => comment.id !== comment_id));

    try {
      await deleteComment(comment_id, commentCourseId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      set_comments(previousComments);
      console.error("Error eliminando comentario:", err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handle_start_edit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handle_save_edit = async (comment_id) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (savingCommentId !== null || deletingCommentId !== null) return;

    const previousComments = comments;
    setSavingCommentId(comment_id);
    set_comments((prev) =>
      prev.map((c) => (c.id === comment_id ? { ...c, text: trimmed } : c))
    );
    setEditingId(null);
    setEditText("");

    try {
      await updateComment(comment_id, trimmed, commentCourseId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      set_comments(previousComments);
      console.error("Error actualizando comentario:", err);
    } finally {
      setSavingCommentId(null);
    }
  };

  const handle_cancel_edit = () => {
    setEditingId(null);
    setEditText("");
  };

  return {
    is_open,
    comments,
    editingId,
    editText,
    setEditText,
    isAddingComment,
    savingCommentId,
    deletingCommentId,
    isCommentsBusy:
      isAddingComment || savingCommentId !== null || deletingCommentId !== null,
    handle_close,
    handle_add_comment,
    handle_delete_comment,
    handle_start_edit,
    handle_save_edit,
    handle_cancel_edit,
  };
}

export default useClassComments;
