import { useLocalSearchParams } from 'expo-router';
import { View, TextInput, Image } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text, Button } from '@/components/ui';
import {
  useReviewDetails,
  useModerateReview,
  useDeleteReview,
  useAddManagementReply,
} from '@/features/reviews';
import { useAuth, useTheme } from '@/providers';
import { useState } from 'react';

export default function ReviewDetailsScreen() {
  const { reviewId } = useLocalSearchParams<{ reviewId: string }>();
  const id = reviewId ?? '';
  const { data, isLoading, isError, refetch } = useReviewDetails(id);
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const canApprove = canAccess('reviews.approve');
  const canReject = canAccess('reviews.reject');
  const canDelete = canAccess('reviews.delete');
  const canReply = canAccess('reviews.reply');
  const moderate = useModerateReview(id);
  const removeReview = useDeleteReview(id);
  const addReply = useAddManagementReply(id);
  const [moderationNote, setModerationNote] = useState('');
  const [showModeration, setShowModeration] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!id) return <Screen scroll><ErrorState title="Missing ID" description="Invalid route." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load review" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll><EmptyState title="Not found" description="Review not found." /></Screen>;

  const canModerate = (canApprove || canReject) && data.status === 'pending';

  return (
    <Screen scroll>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 24, color: i < data.rating ? '#f59e0b' : '#d1d5db' }}>★</Text>
          ))}
          <Text style={{ fontSize: 18, fontWeight: '700' }}>{data.rating}/5</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{data.product.name ?? 'Product'}</Text>
        <Text>Customer: {data.customer.name ?? data.customer.id}</Text>
        {data.title ? <Text style={{ fontWeight: '600' }}>{data.title}</Text> : null}
        <Text>{data.comment}</Text>
        {data.images.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>Images:</Text>
            {data.images.map((img) => (
              <Image key={img.publicId} source={{ uri: img.url }} style={{ width: 120, height: 120, borderRadius: 8 }} />
            ))}
          </View>
        )}
        <View style={{ gap: 4 }}>
          <Text>Status: <Text style={{ fontWeight: '600', color: data.status === 'approved' ? 'green' : data.status === 'rejected' ? 'red' : 'orange' }}>{data.status}</Text></Text>
          {data.moderationNote ? <Text>Moderation Note: {data.moderationNote}</Text> : null}
          <Text>Submitted: {new Date(data.createdAt).toLocaleString()}</Text>
          <Text>Updated: {new Date(data.updatedAt).toLocaleString()}</Text>
        </View>

        {canModerate && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>Moderation Actions</Text>
            {canApprove && (
              <Button title="Approve" variant="primary" onPress={() => { setPendingAction('approve'); setShowModeration(true); }} disabled={moderate.isPending} />
            )}
            {canReject && (
              <Button title="Reject" variant="danger" onPress={() => { setPendingAction('reject'); setShowModeration(true); }} disabled={moderate.isPending} />
            )}
          </View>
        )}
        {showModeration && (
          <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>{pendingAction === 'approve' ? 'Approve Review' : 'Reject Review'}</Text>
            <Text>Moderation Note (optional):</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: 'top', color: theme.colors.text }}
              value={moderationNote}
              onChangeText={setModerationNote}
              placeholder="Reason for moderation..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancel" variant="outline" onPress={() => { setShowModeration(false); setModerationNote(''); setPendingAction(null); }} />
              <Button
                title={pendingAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                variant={pendingAction === 'approve' ? 'primary' : 'danger'}
                onPress={() => {
                  const status = pendingAction === 'approve' ? 'approved' : 'rejected';
                  moderate.mutate({ status, moderationNote: moderationNote.trim() || undefined });
                  setShowModeration(false);
                  setModerationNote('');
                  setPendingAction(null);
                }}
                disabled={moderate.isPending}
              />
            </View>
          </View>
        )}

        {/* Replies thread */}
        <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 8 }}>
          <Text style={{ fontWeight: '600' }}>Replies</Text>
          {data.replies.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>No replies yet.</Text>
          ) : (
            data.replies.map((reply) => (
              <View key={reply.id} style={{ gap: 2, paddingLeft: 8, borderLeftWidth: 2, borderColor: theme.colors.border }}>
                <Text style={{ fontWeight: '600', fontSize: 13 }}>
                  {reply.authorName}
                  {reply.authorType === 'admin' ? ' · Self Aura Team' : ''}
                </Text>
                <Text>{reply.text}</Text>
              </View>
            ))
          )}

          {canReply && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: 'top', color: theme.colors.text }}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
              />
              <Button
                title={addReply.isPending ? 'Posting...' : 'Post Reply'}
                variant="primary"
                disabled={addReply.isPending || replyText.trim().length === 0}
                onPress={() => {
                  const text = replyText.trim();
                  if (!text) return;
                  addReply.mutate(
                    { text },
                    { onSuccess: () => setReplyText('') },
                  );
                }}
              />
            </View>
          )}
        </View>

        {canDelete && (
          <View style={{ gap: 8, marginTop: 8 }}>
            {confirmDelete ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text>Delete this review?</Text>
                <Button
                  title={removeReview.isPending ? 'Deleting...' : 'Confirm'}
                  variant="danger"
                  disabled={removeReview.isPending}
                  onPress={() => removeReview.mutate()}
                />
                <Button title="Cancel" variant="outline" onPress={() => setConfirmDelete(false)} />
              </View>
            ) : (
              <Button title="Delete Review" variant="danger" onPress={() => setConfirmDelete(true)} />
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}