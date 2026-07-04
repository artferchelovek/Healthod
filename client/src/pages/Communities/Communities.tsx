import styles from "./Communities.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCommunities, getMyCommunities, createCommunity, joinCommunity, leaveCommunity } from "@/logic/community";
import type { Community } from "@/logic/community";
import { getUserIdFromToken } from "@/logic/utils";
import Modal from "@/components/Modal/Modal";

export default function Communities() {
  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"my" | "all">("my");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [all, my] = await Promise.all([getCommunities(), getMyCommunities()]);
      setAllCommunities(all);
      setMyCommunities(my);
      setMyIds(new Set(my.map((c) => c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await createCommunity({ name: createName.trim(), description: createDesc.trim() || undefined });
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await joinCommunity(id);
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveCommunity(id);
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const list = tab === "my" ? myCommunities : allCommunities;

  return (
    <div className={styles.container}>
      <div className={styles.tabsRow}>
        <button className={`${styles.tabBtn} ${tab === "my" ? styles.activeTab : ""}`} onClick={() => setTab("my")}>
          Мои
        </button>
        <button className={`${styles.tabBtn} ${tab === "all" ? styles.activeTab : ""}`} onClick={() => setTab("all")}>
          Все
        </button>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <span className="msym" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : list.length === 0 ? (
        <div className={styles.empty}>
          {tab === "my" ? "Вы не состоите ни в одном сообществе" : "Сообществ пока нет"}
        </div>
      ) : (
        <div className={styles.list}>
          {list.map((c) => {
            const isMember = myIds.has(c.id);
            const isOwner = c.ownerId === userId;
            return (
              <div key={c.id} className={styles.card} onClick={() => navigate(`/communities/${c.id}`)}>
                <div className={styles.cardAvatar}>
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarLetter}>{c.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardName}>{c.name}</span>
                  {c.description && <span className={styles.cardDesc}>{c.description}</span>}
                  <span className={styles.cardMeta}>{c._count.members} участников · {c._count.posts} постов</span>
                </div>
                <div className={styles.cardActions}>
                  {!isOwner && isMember && (
                    <button className={styles.leaveBtn} onClick={(e) => { e.stopPropagation(); handleLeave(c.id); }}>
                      Покинуть
                    </button>
                  )}
                  {!isMember && (
                    <button className={styles.joinBtn} onClick={(e) => { e.stopPropagation(); handleJoin(c.id); }}>
                      Вступить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Создать сообщество">
        <div className={styles.createForm}>
          <input type="text" placeholder="Название" value={createName} onChange={(e) => setCreateName(e.target.value)} className={styles.createInput} />
          <textarea placeholder="Описание (необязательно)" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} className={styles.createTextarea} rows={3} />
          <button className={styles.submitBtn} onClick={handleCreate} disabled={creating || !createName.trim()}>
            {creating ? "Создание..." : "Создать"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
