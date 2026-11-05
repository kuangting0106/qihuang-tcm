-- 岐黄图鉴只读数据（由 scripts/build-db.mjs 生成，可重复覆盖）
-- 常用查询字段单独成列，完整对象保留在 data_json，保证 API 返回形状与 sample_data 一致。

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  work TEXT NOT NULL,
  locator TEXT NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE herbs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  classic_rank_id TEXT,
  effects_text TEXT NOT NULL DEFAULT '',
  data_json TEXT NOT NULL
);

CREATE TABLE formulas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  pinyin_flat TEXT NOT NULL,
  source_id TEXT NOT NULL,
  effects_text TEXT NOT NULL DEFAULT '',
  symptom_tags_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL
);

CREATE TABLE formula_composition (
  formula_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  herb_id TEXT NOT NULL,
  herb_name TEXT,
  dose TEXT,
  role TEXT,
  data_json TEXT NOT NULL,
  PRIMARY KEY (formula_id, sort_order)
);

CREATE TABLE formula_symptoms (
  formula_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  kind TEXT,
  citation_ids_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL,
  PRIMARY KEY (formula_id, sort_order)
);

CREATE TABLE formula_annotations (
  formula_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  annotation_id TEXT,
  phrase TEXT,
  note TEXT,
  citation_ids_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL,
  PRIMARY KEY (formula_id, sort_order)
);

CREATE TABLE formula_modifications (
  formula_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  condition TEXT,
  change TEXT,
  citation_ids_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL,
  PRIMARY KEY (formula_id, sort_order)
);

CREATE TABLE formula_preparation (
  formula_id TEXT NOT NULL,
  field TEXT NOT NULL,
  text TEXT,
  locator TEXT,
  citation_ids_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL,
  PRIMARY KEY (formula_id, field)
);

CREATE TABLE bencao_groups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  entry_count INTEGER NOT NULL DEFAULT 0,
  char_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

CREATE TABLE bencao_entries (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  number INTEGER,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  pinyin TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  aliases_json TEXT NOT NULL DEFAULT '[]',
  char_count INTEGER NOT NULL DEFAULT 0,
  section_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

-- 本草讲义药目索引（由 catalog.json 生成），供 /herbs 检索与分类页使用。
CREATE TABLE herb_lecture_index (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pinyin TEXT NOT NULL DEFAULT '',
  group_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  rank_id TEXT NOT NULL,
  number INTEGER,
  therapy_category_ids_json TEXT NOT NULL DEFAULT '[]',
  data_json TEXT NOT NULL
);

CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE INDEX idx_formulas_name ON formulas(name);
CREATE INDEX idx_formulas_pinyin ON formulas(pinyin);
CREATE INDEX idx_formula_composition_formula ON formula_composition(formula_id);
CREATE INDEX idx_bencao_entries_group ON bencao_entries(group_id);
CREATE INDEX idx_herb_lecture_name ON herb_lecture_index(name);
CREATE INDEX idx_herb_lecture_rank ON herb_lecture_index(rank_id);
CREATE INDEX idx_sources_id ON sources(id);
