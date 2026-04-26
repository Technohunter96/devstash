-- CreateIndex
CREATE INDEX "collections_user_id_updated_at_idx" ON "collections"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "collections_user_id_is_favorite_updated_at_idx" ON "collections"("user_id", "is_favorite", "updated_at");

-- CreateIndex
CREATE INDEX "item_collections_collection_id_idx" ON "item_collections"("collection_id");

-- CreateIndex
CREATE INDEX "items_user_id_last_used_at_idx" ON "items"("user_id", "last_used_at");

-- CreateIndex
CREATE INDEX "items_user_id_is_pinned_idx" ON "items"("user_id", "is_pinned");

-- CreateIndex
CREATE INDEX "items_user_id_is_favorite_idx" ON "items"("user_id", "is_favorite");
