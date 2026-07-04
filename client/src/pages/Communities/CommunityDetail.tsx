import styles from "./CommunityDetail.module.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCommunityById, getCommunityMembers, joinCommunity, leaveCommunity } from "@/logic/community";
import type { CommunityDetail as CommunityDetailType, CommunityMember } from "@/logic/community";
import { getUserIdFromToken } from "@/logic/utils";

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  const [community, setCommunity] = useState<CommunityDetailType | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, m] = await Promise.all([getCommunityById(id), getCommunityMembers(id)]);
      setCommunity(c);
      setMembers(m);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleJoinLeave = async () => {
    if (!community) return;
    try {
      if (community.isMember) {
        await leaveCommunity(community.id);
      } else {
        await joinCommunity(community.id);
      }
      await loadData();
    } catch (err) { console.error(err); }
  };

  const handleCopyInvite = () => {
    if (!id) return;
    navigator.clipboard.writeText(`${window.location.origin}/communities/${id}`).catch(() => {});
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!community) {
    return <div className={styles.loading}>Сообщество не найдено</div>;
  }

  const isOwner = community.ownerId === userId;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate("/communities")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Назад
      </button>

      <div className={styles.header}>
        <div className={styles.avatar}>
          {community.avatarUrl ? (
            <img src={community.avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarLetter}>{community.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className={styles.name}>{community.name}</h1>
        {community.description && <p className={styles.desc}>{community.description}</p>}
        <div className={styles.stats}>
          <span>{community._count.members} участников</span>
          <span>·</span>
          <span>{community._count.posts} постов</span>
        </div>
        <div className={styles.actions}>
          {community.isMember && (
            <button className={styles.chatBtn} onClick={() => navigate("/chat")}>
              <span className="msym" style={{ fontSize: 18 }}>chat</span>
              Перейти в чат
            </button>
          )}
          {!isOwner && (
            <button className={community.isMember ? styles.leaveBtn : styles.joinBtn} onClick={handleJoinLeave}>
              {community.isMember ? "Покинуть" : "Вступить"}
            </button>
          )}
          <button className={styles.inviteBtn} onClick={handleCopyInvite}>
            <span className="msym" style={{ fontSize: 18 }}>link</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <button className={styles.sectionTitle} onClick={() => setShowMembers(!showMembers)}>
          Участники ({members.length})
          <span className="msym" style={{ fontSize: 18 }}>{showMembers ? "expand_less" : "expand_more"}</span>
        </button>
        {showMembers && (
          <div className={styles.membersList}>
            {members.map((m) => (
              <div key={m.id} className={styles.memberRow}>
                <div className={styles.memberAvatar}>
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className={styles.memberAvatarImg} /> : m.username.charAt(0).toUpperCase()}
                </div>
                <span className={styles.memberName}>{m.username}</span>
                {m.isOwner && <span className={styles.ownerBadge}>Создатель</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
