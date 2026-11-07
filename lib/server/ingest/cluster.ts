import 'server-only';
import { getDb } from '@/lib/server/db';

/**
 * Calculates trigram similarity between two strings (0.0 to 1.0)
 * Fallback in TypeScript if database trigram RPC is unavailable.
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const getTrigrams = (str: string) => {
    const s = `  ${str} `;
    const set = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) {
      set.add(s.substring(i, i + 3));
    }
    return set;
  };

  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  let matches = 0;
  trigramsA.forEach((tri) => {
    if (trigramsB.has(tri)) matches++;
  });

  const total = trigramsA.size + trigramsB.size;
  return total === 0 ? 0 : (2 * matches) / total;
}

/**
 * Cluster an article with existing clusters or recent articles
 */
export async function clusterArticle(articleId: string, titleNorm: string, outlet: string): Promise<string | null> {
  const db = getDb();

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 1. Fetch recent articles in last 48 hours
    const { data: recentArticles, error } = await db
      .from('articles')
      .select('id, cluster_id, title_norm, outlet')
      .neq('id', articleId)
      .gte('fetched_at', fortyEightHoursAgo);

    if (error || !recentArticles) return null;

    let bestMatch: { clusterId: string | null; articleId: string; score: number } | null = null;

    for (const recent of recentArticles) {
      const score = calculateTrigramSimilarity(titleNorm, recent.title_norm);
      if (score >= 0.45) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { clusterId: recent.cluster_id, articleId: recent.id, score };
        }
      }
    }

    let targetClusterId: string;

    if (bestMatch && bestMatch.clusterId) {
      // Join existing cluster
      targetClusterId = bestMatch.clusterId;
    } else if (bestMatch) {
      // Create new cluster from matching article and this article
      const { data: newCluster, error: clusterErr } = await db
        .from('clusters')
        .insert({
          headline: titleNorm,
          outlet_count: 2,
          trend_score: 2,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (clusterErr || !newCluster) return null;
      targetClusterId = newCluster.id;

      // Update the previous matched article
      await db.from('articles').update({ cluster_id: targetClusterId }).eq('id', bestMatch.articleId);
    } else {
      // No match found; create a single-article cluster
      const { data: newCluster, error: clusterErr } = await db
        .from('clusters')
        .insert({
          headline: titleNorm,
          outlet_count: 1,
          trend_score: 1,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (clusterErr || !newCluster) return null;
      targetClusterId = newCluster.id;
    }

    // Attach cluster to current article
    await db.from('articles').update({ cluster_id: targetClusterId }).eq('id', articleId);

    // Update cluster outlet_count & trend_score
    const { data: clusterArticles } = await db
      .from('articles')
      .select('outlet, fetched_at')
      .eq('cluster_id', targetClusterId);

    if (clusterArticles) {
      const distinctOutlets = new Set(clusterArticles.map((a) => a.outlet).filter(Boolean)).size;
      const hoursAgo = 0; // Fresh
      const trendScore = distinctOutlets * Math.exp(-hoursAgo / 12);

      await db
        .from('clusters')
        .update({
          outlet_count: distinctOutlets,
          trend_score: Number(trendScore.toFixed(2)),
          last_seen: new Date().toISOString(),
        })
        .eq('id', targetClusterId);
    }

    return targetClusterId;
  } catch {
    return null;
  }
}

