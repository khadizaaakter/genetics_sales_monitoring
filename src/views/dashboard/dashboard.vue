<template>
  <MainLayout>
    <div class="dash">
      <!-- ============ Filter bar ============ -->
      <section class="filters">
        <!-- <span class="filters__icon"><CalendarOutlined /></span> -->
        <div class="filters__field filters__field--date">
          <label class="filters__label">Date Range</label>
          <a-range-picker
            v-model:value="filters.range"
            :allow-clear="false"
            format="DD MMM YYYY"
            class="w-full"
          />
        </div>
        <div v-for="f in filterFields()" :key="f.key" class="filters__field">
          <label class="filters__label">{{ f.label }}</label>
          <a-select
            v-model:value="filters[f.key]"
            :options="f.options"
            :placeholder="f.placeholder"
            :disabled="f.disabled"
            :loading="f.loading"
            allow-clear
            show-search
            :filter-option="false"
            :dropdown-match-select-width="false"
            class="w-full"
            @search="(q) => (filterSearch[f.key] = q)"
            @dropdown-visible-change="(open) => !open && (filterSearch[f.key] = '')"
            @change="onFilterChange(f.key)"
          >
            <template #dropdownRender="{ menuNode }">
              <component :is="menuNode" />
              <div v-if="f.hidden" class="filters__limit">
                Showing {{ MAX_FILTER_ITEMS }} of {{ f.total }} · type to search
              </div>
            </template>
          </a-select>
        </div>
        <div class="filters__actions">
          <a-button
            type="primary"
            :loading="loading.main || loading.lower"
            @click="applyFilters"
          >
            <SearchOutlined /> Apply Filter
          </a-button>
          <a-button class="btn-tinted btn-reset" @click="resetFilters"
            ><ReloadOutlined /> Reset</a-button
          >
          <!-- <a-button
            class="btn-tinted btn-export"
            :disabled="loading.main || loading.lower"
            @click="exportExcel"
          >
            <FileExcelOutlined /> Export Excel
          </a-button> -->
        </div>
      </section>

      <!-- ============ 7 summary cards (sp_GeneticsDashboard RS1 · kpi) ============ -->
      <section class="stat-grid">
        <div
          v-for="(c, i) in statCards()"
          :key="c.key"
          class="stat"
          :style="{ '--c1': c.c1, '--c2': c.c2, animationDelay: i * 40 + 'ms' }"
        >
          <div class="stat__head">
            <span class="stat__icon"><component :is="c.icon" /></span>
            <div class="stat__text">
              <span class="stat__label">{{ c.label }}</span>
              <a-skeleton-button
                v-if="c.loading"
                active
                size="small"
                class="stat__skeleton"
              />
              <p v-else class="stat__value">{{ c.display }}</p>
            </div>
          </div>

          <div class="stat__foot">
            <div v-if="!c.noMeta" class="stat__meta">
              <template v-if="!c.loading">
                <span :class="['trend', c.deltaCls]">
                  <component v-if="c.up !== null" :is="c.up ? CaretUpFilled : CaretDownFilled" />
                  {{ c.delta }}
                </span>
                <span class="stat__hint">{{ prevLabel() }}</span>
              </template>
            </div>

            <!-- Sparkline of the period, or a share bar for ratio cards -->
            <svg
              v-if="c.spark && c.spark.length > 1 && !c.loading"
              class="stat__spark"
              viewBox="0 0 80 30"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient :id="`spark-${c.key}`" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="c.c1" stop-opacity="0.28" />
                  <stop offset="100%" :stop-color="c.c1" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="sparkArea(c.spark)" :fill="`url(#spark-${c.key})`" />
              <path :d="sparkLine(c.spark)" class="stat__spark-line" />
            </svg>
          </div>
        </div>
      </section>

      <!-- ============ Business performance: Area → MO → Dealer ============ -->
      <section class="biz mt-5">
        <div class="biz__head">
          <h2 class="biz__title">
            <span class="sec-icon sec-icon--grad"><BarChartOutlined /></span>
            Business Performance
          </h2>
        </div>

        <div class="biz-grid">
          <!-- Area-wise -->
          <div class="card biz-card" style="--tone: #2563eb; --tone-soft: #eff6ff">
            <div class="card__head">
              <div class="card__title-wrap">
                <span class="sec-icon"><ClusterOutlined /></span>
                <div>
                  <h3 class="card__title">Area-wise Sales Performance</h3>
                  <p class="card__hint">Sales &amp; growth vs previous period</p>
                </div>
              </div>
            </div>
            <a-spin :spinning="loading.main">
              <a-empty
                v-if="!bizArea.length && !loading.main"
                class="py-10"
                description="No sales in this period"
              />
              <div v-else class="biz-scroll">
                <v-chart
                  class="biz-chart"
                  :style="{ height: barHeight(bizArea.length) }"
                  :option="areaOption()"
                  autoresize
                />
              </div>
            </a-spin>
          </div>

          <!-- Dealer-wise -->
          <div class="card biz-card" style="--tone: #059669; --tone-soft: #ecfdf5">
            <div class="card__head">
              <div class="card__title-wrap">
                <span class="sec-icon"><ShopOutlined /></span>
                <div>
                  <h3 class="card__title">Dealer-wise Performance</h3>
                  <p class="card__hint">
                    {{ bizDealer.length }} dealers · ranked by sales
                  </p>
                </div>
              </div>
              <div class="biz-legend">
                <span><i style="background: #10b981" />Sales</span>
              </div>
            </div>
            <a-spin :spinning="loading.main">
              <a-empty
                v-if="!bizDealer.length && !loading.main"
                class="py-10"
                description="No sales in this period"
              />
              <div v-else class="biz-scroll">
                <v-chart
                  class="biz-chart"
                  :style="{ height: barHeight(bizDealer.length) }"
                  :init-options="SVG_INIT"
                  :option="dealerOption()"
                  autoresize
                />
              </div>
            </a-spin>
          </div>

          <!-- MO-wise (full width, below Area + Dealer) -->
          <div
            class="card biz-card biz-card--wide"
            style="--tone: #7c3aed; --tone-soft: #f5f3ff"
          >
            <div class="card__head">
              <div class="card__title-wrap">
                <span class="sec-icon"><UserOutlined /></span>
                <div>
                  <h3 class="card__title">MO-wise Performance</h3>
                  <p class="card__hint">{{ bizMo.length }} MOs · hover for details</p>
                </div>
              </div>
              <div class="biz-legend">
                <span><i style="background: #7c3aed" />Sales</span>
                <span><i class="is-line" style="background: #f97316" />Collection %</span>
              </div>
            </div>
            <a-spin :spinning="loading.main">
              <a-empty
                v-if="!bizMo.length && !loading.main"
                class="py-10"
                description="No sales in this period"
              />
              <div v-else class="biz-scroll biz-scroll--x">
                <v-chart
                  class="biz-chart"
                  :style="{ height: '250px', minWidth: bizMo.length * 64 + 'px' }"
                  :option="moOption()"
                  autoresize
                />
              </div>
            </a-spin>
          </div>
        </div>
      </section>

      <!-- ============ LA engagement · Product & portfolio ============ -->
      <div class="eng-grid mt-5">
        <!-- ---------- LA Performance & Engagement ---------- -->
        <section class="eng">
          <div class="biz__head">
            <h2 class="biz__title">
              <span class="sec-icon" style="--tone: #0284c7; --tone-soft: #e0f2fe"
                ><TeamOutlined
              /></span>
              LA Performance &amp; Engagement
            </h2>
            <span class="count-pill">{{ topLas.length }} buying LAs</span>
          </div>

          <div class="eng-body">
            <!-- Top performing LAs -->
            <div class="card eng-card eng-card--wide" style="--tone: #0284c7">
              <div class="eng-card__head">
                <h3>Top Performing LAs</h3>
                <span class="eng-card__hint">Ranked by sales</span>
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!topLas.length && !loading.lower"
                  class="py-6"
                  description="No LA purchases in this period"
                />
                <div v-else class="biz-scroll eng-scroll">
                  <table
                    class="eng-table eng-table--grid"
                    style="--head-from: #0284c7; --head-to: #06b6d4"
                  >
                    <thead>
                      <tr>
                        <th class="w-10">#</th>
                        <th>LA Name</th>
                        <th>Dealer</th>
                        <th class="num">Sales (Tk)</th>
                        <th class="num">Active Days</th>
                        <th class="num">Products</th>
                        <th>Product Mix</th>
                        <th class="num">Repeat %</th>
                        <th class="num">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(la, i) in pageRows('la', topLas)" :key="la.key">
                        <td>
                          <span
                            class="rank"
                            :class="{ 'rank--top': rowNo('la', topLas.length, i) <= 3 }"
                            >{{ rowNo("la", topLas.length, i) }}</span
                          >
                        </td>
                        <td>
                          <div class="eng-name">{{ la.name }}</div>
                          <div class="eng-sub">ID {{ la.key }}</div>
                        </td>
                        <td>{{ spText(la.dealerCode) }}</td>
                        <td class="num">
                          <b>{{ spText(la.value) }}</b>
                        </td>
                        <td class="num">{{ spText(la.days) }}</td>
                        <td class="num">{{ spText(la.products) }}</td>
                        <td>
                          <span class="mix" :class="`mix--${str(la.mix).toLowerCase()}`">{{
                            la.mix
                          }}</span>
                        </td>
                        <td class="num">{{ spPct(la.repeatPct) }}</td>
                        <td class="num" :class="{ 'is-due': num(la.due) > 0 }">
                          {{ spText(la.due) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="topLas.length > PAGE_SIZE" class="eng-pager">
                  <a-pagination
                    :current="pageNo('la', topLas.length)"
                    :page-size="PAGE_SIZE"
                    :total="topLas.length"
                    @change="(p) => setPage('la', p)"
                    :show-size-changer="false"
                    size="small"
                  />
                </div>
              </a-spin>
            </div>

            <!-- Segmentation -->
            <div class="card eng-card">
              <div class="eng-card__head">
                <h3>LA Segmentation</h3>
                <span class="eng-card__hint" v-if="laSeg"
                  >{{ spText(laSeg.TotalLAs) }} active LAs</span
                >
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!laSeg && !loading.lower"
                  class="py-6"
                  description="No data"
                />
                <div v-else-if="laSeg" class="seg-tiles">
                  <div
                    v-for="s in laSegTiles()"
                    :key="s.id"
                    class="seg-tile"
                    :class="{ 'seg-tile--wide': s.id === 'priority' }"
                    :style="{ '--c': s.c }"
                    :title="s.hint"
                  >
                    <span class="seg-tile__icon"><component :is="s.icon" /></span>
                    <span class="seg-tile__body">
                      <span class="seg-tile__label">{{ s.label }}</span>
                      <b class="seg-tile__value">{{ s.count }}</b>
                      <span class="seg-tile__pct">{{ s.pct }} of active LAs</span>
                    </span>
                  </div>
                </div>
              </a-spin>
            </div>

            <!-- Repeat vs one-time -->
            <div class="card eng-card">
              <div class="eng-card__head">
                <h3>Repeat LA vs One-Time LA</h3>
                <span class="eng-card__hint">Of LAs who bought</span>
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!hasBuyers() && !loading.lower"
                  class="py-6"
                  description="No LA purchases in this period"
                />
                <div v-else-if="hasBuyers()" class="repeat">
                  <v-chart class="repeat__chart" :option="repeatOption()" autoresize />
                  <div class="repeat__legend">
                    <div v-for="part in repeatParts()" :key="part.id" class="repeat__item">
                      <span class="repeat__label"
                        ><i :style="{ background: part.color }" />{{ part.label }}</span
                      >
                      <b class="repeat__pct" :style="{ color: part.color }">{{
                        spPct(part.pct)
                      }}</b>
                      <span class="repeat__count">{{ spText(part.count) }} LAs</span>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>
          </div>
        </section>

        <!-- ---------- Product & Portfolio Performance ---------- -->
        <section class="eng">
          <div class="biz__head">
            <h2 class="biz__title">
              <span class="sec-icon" style="--tone: #4f46e5; --tone-soft: #eef2ff"
                ><AppstoreOutlined
              /></span>
              Product &amp; Portfolio Performance
            </h2>
            <span class="count-pill">{{ topProducts.length }} products</span>
          </div>

          <div class="eng-body">
            <!-- Portfolio contribution -->
            <div class="card eng-card eng-card--wide" style="--tone: #4f46e5">
              <div class="eng-card__head">
                <h3>Portfolio Contribution</h3>
                <span class="eng-card__hint">Share of sales</span>
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!pfContrib.length && !loading.lower"
                  class="py-6"
                  description="No sales in this period"
                />
                <template v-else>
                  <div class="biz-scroll pf-list">
                    <div class="pf-row pf-row--head">
                      <span></span>
                      <span>Portfolio</span>
                      <span class="pf-row__num">Sales (Tk)</span>
                      <span>Share</span>
                      <span>LAs Bought</span>
                      <span>Growth</span>
                      <span>Collection</span>
                    </div>
                    <div
                      v-for="p in pfContrib"
                      :key="p.key"
                      class="pf-row"
                      :style="{ '--c': p.color }"
                    >
                      <span class="pf-row__icon">{{ str(p.name).charAt(0) }}</span>
                      <span class="pf-row__name"
                        >{{ p.name
                        }}<small v-if="p.categoryId !== null">ID {{ p.categoryId }}</small></span
                      >
                      <span class="pf-row__stat pf-row__num"><b>{{ spText(p.value) }}</b></span>
                      <span class="pf-row__stat"><b>{{ spPct(p.share) }}</b></span>
                      <span class="pf-row__stat"><b>{{ spText(p.activeLas) }}</b></span>
                      <span class="pf-row__stat"
                        ><b :class="growthCls(p.growth)">{{ growthLabel(p.growth) }}</b></span
                      >
                      <span class="pf-row__stat"><b>{{ spPct(p.rate) }}</b></span>
                    </div>
                  </div>
                </template>
              </a-spin>
            </div>

            <!-- Top products -->
            <div class="card eng-card eng-card--wide" style="--tone: #4f46e5">
              <div class="eng-card__head">
                <h3>Top Products</h3>
                <span class="eng-card__hint"
                  >Status from share, growth and collection</span
                >
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!topProducts.length && !loading.lower"
                  class="py-6"
                  description="No sales in this period"
                />
                <div v-else class="biz-scroll eng-scroll">
                  <table
                    class="eng-table eng-table--grid"
                    style="--head-from: #7c3aed; --head-to: #c026d3"
                  >
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th class="num">Sales (Tk)</th>
                        <th class="num">Share</th>
                        <th class="num">LAs</th>
                        <th class="num">Growth</th>
                        <th class="num">Collection</th>
                        <th class="num">Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in pageRows('products', topProducts)" :key="p.key">
                        <td>
                          <div class="eng-name">{{ p.name }}</div>
                          <div class="eng-sub">{{ p.key }}</div>
                        </td>
                        <td class="num">
                          <b>{{ spText(p.value) }}</b>
                        </td>
                        <td class="num">{{ spPct(p.share) }}</td>
                        <td class="num">{{ spText(p.activeLas) }}</td>
                        <td class="num" :class="growthCls(p.growth)">
                          {{ growthLabel(p.growth) }}
                        </td>
                        <td class="num">
                          <span
                            v-if="p.rate !== null"
                            class="dt-rate"
                            :class="rateLevel(num(p.rate))"
                            >{{ spPct(p.rate) }}</span
                          >
                          <template v-else>-</template>
                        </td>
                        <td class="num" :class="{ 'is-due': num(p.due) > 0 }">
                          {{ spText(p.due) }}
                        </td>
                        <td>
                          <span class="st" :class="statusCls(p.status)">{{
                            p.status
                          }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="topProducts.length > PAGE_SIZE" class="eng-pager">
                  <a-pagination
                    :current="pageNo('products', topProducts.length)"
                    :page-size="PAGE_SIZE"
                    :total="topProducts.length"
                    :show-size-changer="false"
                    size="small"
                    @change="(p) => setPage('products', p)"
                  />
                </div>
              </a-spin>
            </div>
          </div>
        </section>
      </div>

      <!-- ============ Inventory risk · Payment & due aging ============ -->
      <div class="eng-grid eng-grid--stack mt-5">
        <!-- ---------- Inventory & Stock Risk ---------- -->
        <section class="eng">
          <div class="biz__head">
            <h2 class="biz__title">
              <span class="sec-icon" style="--tone: #4f46e5; --tone-soft: #eef2ff"
                ><InboxOutlined
              /></span>
              Inventory &amp; Stock Risk
            </h2>
            <!-- <a class="biz__link" @click="router.push('/present_stock_summary')">
              View Detailed Inventory <ArrowRightOutlined />
            </a> -->
          </div>

          <div class="card eng-card risk-card" style="--tone: #4f46e5">
            <a-spin :spinning="loading.lower">
              <a-empty
                v-if="!inventory && !loading.lower"
                class="py-6"
                description="No stock data"
              />
              <div v-else-if="inventory" class="risk-layout">
                <div class="risk-tiles">
                  <div
                    v-for="t in riskTiles()"
                    :key="t.key"
                    class="risk-tile"
                    :style="{ '--c': t.c }"
                    :title="t.hint"
                  >
                    <div class="risk-tile__top">
                      <span class="risk-tile__label">{{ t.label }}</span>
                      <span class="risk-tile__icon"><component :is="t.icon" /></span>
                    </div>
                    <b class="risk-tile__value"
                      >{{ t.value }} <small v-if="t.unit">{{ t.unit }}</small></b
                    >
                    <span v-if="t.sub" class="risk-tile__sub">{{ t.sub }}</span>
                  </div>
                </div>
                <!-- Dealers at risk: one grouped panel instead of loose chips -->
                <div class="risk-dealers">
                  <div class="risk-dealers__head">
                    <ShopOutlined /> Dealers at risk
                  </div>
                  <div class="risk-dealers__row">
                    <div
                      v-for="c in riskChips()"
                      :key="c.id"
                      class="risk-dealer"
                      :style="{ '--c': c.c }"
                      :title="c.hint"
                    >
                      <span class="risk-dealer__icon"><component :is="c.icon" /></span>
                      <b class="risk-dealer__count">{{ c.count }}</b>
                      <small class="risk-dealer__label">{{ c.label }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>
        </section>

        <!-- ---------- Dealer Payment & Due Aging ---------- -->
        <section class="eng">
          <div class="biz__head">
            <h2 class="biz__title">
              <span class="sec-icon" style="--tone: #0d9488; --tone-soft: #f0fdfa"
                ><WalletOutlined
              /></span>
              Dealer Payment &amp; Due Aging
            </h2>
            <a class="biz__link" @click="router.push('/report')">
              View Details <ArrowRightOutlined />
            </a>
          </div>

          <div class="pay-tiles">
            <div
              v-for="(t, idx) in payTiles()"
              :key="t.key"
              class="pay-tile"
              :style="{ '--c': t.c, '--i': idx }"
            >
              <span class="pay-tile__icon"><component :is="t.icon" /></span>
              <div class="pay-tile__body">
                <span class="pay-tile__label">{{ t.label }}</span>
                <a-skeleton-button
                  v-if="loading.lower"
                  active
                  size="small"
                  class="pay-tile__skeleton"
                />
                <template v-else-if="payment">
                  <b class="pay-tile__value">{{ t.value }}</b>
                  <span class="pay-tile__delta" :class="t.deltaCls">{{ t.delta }}</span>
                </template>
                <b v-else class="pay-tile__value">-</b>
              </div>
            </div>
          </div>

          <div class="pay-body">
            <div class="card eng-card" style="--tone: #ca8a04">
              <div class="eng-card__head">
                <h3>Due Aging (Tk)</h3>
                <span class="eng-card__hint">Days since purchase</span>
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!hasAgingDue() && !loading.lower"
                  class="py-6"
                  description="No outstanding due"
                />
                <v-chart
                  v-else-if="hasAgingDue()"
                  class="aging-chart"
                  :option="agingOption()"
                  autoresize
                />
              </a-spin>
            </div>

            <div class="card eng-card" style="--tone: #0d9488">
              <div class="eng-card__head">
                <h3>Top Due Dealers</h3>
                <span class="eng-card__hint">{{ dueDealers.length }} dealers with due</span>
              </div>
              <a-spin :spinning="loading.lower">
                <a-empty
                  v-if="!dueDealers.length && !loading.lower"
                  class="py-6"
                  description="No dealer has due"
                />
                <div v-else class="biz-scroll eng-scroll">
                  <table
                    class="eng-table eng-table--grid"
                    style="--head-from: #0d9488; --head-to: #10b981"
                  >
                    <thead>
                      <tr>
                        <th>Dealer</th>
                        <th>Area</th>
                        <th>MO</th>
                        <th class="num">Due (Tk)</th>
                        <th>Last Payment</th>
                        <th class="num">Due Age</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="d in pageRows('due', dueDealers)" :key="d.key">
                        <td>
                          <div class="eng-name">{{ d.name }}</div>
                          <div class="eng-sub">{{ d.key }}</div>
                        </td>
                        <td class="wrap">{{ spText(d.area) }}</td>
                        <td class="wrap">{{ spText(d.mo) }}</td>
                        <td class="num is-due">{{ spText(d.due) }}</td>
                        <td>{{ spText(d.lastPay) }}</td>
                        <td class="num">
                          <span class="age" :class="dueStatusCls('age', d.status)">{{
                            d.age === null || d.age === undefined ? "-" : `${d.age} days`
                          }}</span>
                        </td>
                        <td>
                          <span class="st" :class="dueStatusCls('st', d.status)">{{
                            d.status
                          }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="dueDealers.length > PAGE_SIZE" class="eng-pager">
                  <a-pagination
                    :current="pageNo('due', dueDealers.length)"
                    :page-size="PAGE_SIZE"
                    :total="dueDealers.length"
                    :show-size-changer="false"
                    size="small"
                    @change="(p) => setPage('due', p)"
                  />
                </div>
              </a-spin>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ============ Step 1: breakdown type picker ============ -->
    <a-modal
      :open="picker.open"
      :footer="null"
      :width="720"
      centered
      :wrap-class-name="`bd-modal tone-${toneOf(picker.subject)}`"
      @cancel="picker.open = false"
    >
      <template #title>
        <div class="bd-title-row">
          <span class="bd-title-icon"><component :is="iconOf(picker.subject)" /></span>
          <div>
            <div class="bd-title">{{ subjectLabel(picker.subject) }}</div>
            <div class="bd-subtitle">Select breakdown type</div>
          </div>
        </div>
      </template>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="m in MODES"
          :key="m.id"
          type="button"
          class="choice"
          @click="startBreakdown(m.id)"
        >
          <span class="choice__icon"><component :is="m.icon" /></span>
          <span class="choice__label">{{ m.label }}</span>
          <span class="choice__path">
            <template v-for="(step, s) in m.steps" :key="step">
              <span v-if="s" class="choice__arrow">›</span>
              <span class="choice__step">{{ step }}</span>
            </template>
          </span>
        </button>
      </div>
    </a-modal>

    <!-- ============ Step 2+: ONE drill-down modal; its content swaps per level ============ -->
    <a-modal
      v-for="layer in layers.slice(-1)"
      key="drill"
      :open="true"
      :footer="null"
      :width="1000"
      centered
      :wrap-class-name="`bd-modal tone-${toneOf(layer.subject)}`"
      @cancel="closeAll"
    >
      <template #title>
        <div class="bd-title-row">
          <button
            v-if="layers.length > 1"
            type="button"
            class="bd-back"
            title="Back"
            @click="goBack"
          >
            <ArrowLeftOutlined />
          </button>
          <span v-else class="bd-title-icon"
            ><component :is="iconOf(layer.subject)"
          /></span>
          <div class="min-w-0">
            <div class="bd-title">{{ subjectLabel(layer.subject) }}</div>
            <div class="bd-crumbs">
              <template v-for="(crumb, c) in crumbsOf()" :key="c">
                <span v-if="c" class="bd-crumbs__sep">›</span>
                <a
                  v-if="c < layers.length - 1"
                  class="bd-crumbs__link"
                  @click="jumpTo(c)"
                  >{{ crumb }}</a
                >
                <span v-else class="bd-crumbs__current">{{ crumb }}</span>
              </template>
            </div>
          </div>
        </div>
      </template>

      <a-alert
        v-if="layer.unavailable"
        type="info"
        show-icon
        message="Sales area breakdown is not available yet"
        :description="`The dashboard calls GET /${AREA_ENDPOINT}, which returns each dealer's Area (Level2) and MO (Level1). Once the backend provides it, this view fills in automatically.`"
      />

      <a-spin v-else :key="layer.id" :spinning="layer.loading">
        <div class="bd-head">
          <span class="bd-head__title">{{ layer.level.label }} Wise</span>
          <span class="bd-badge">
            {{ fmt(layer.rows.length) }} {{ layer.level.label }} · Total:
            {{ fmt(layerTotal(layer)) }}
          </span>
          <a-input-search
            v-if="layer.rows.length > 10"
            v-model:value="layer.search"
            @change="setPage(`bd-${layer.id}`, 1)"
            placeholder="Search"
            allow-clear
            size="small"
            class="ml-auto"
            style="max-width: 220px"
          />
        </div>

        <div class="bd-table-wrap">
          <table class="bd-table">
            <thead>
              <tr>
                <th class="w-12">#</th>
                <th
                  v-for="col in layerColumns(layer)"
                  :key="col.key"
                  :class="{ 'text-right': col.num }"
                >
                  {{ col.title }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!visibleRows(layer).length">
                <td
                  :colspan="layerColumns(layer).length + 1"
                  class="text-center text-gray-400 py-6"
                >
                  No data
                </td>
              </tr>
              <tr
                v-for="(row, r) in pageRows(`bd-${layer.id}`, visibleRows(layer))"
                :key="row.key"
              >
                <td class="text-gray-400">
                  {{ rowNo(`bd-${layer.id}`, visibleRows(layer).length, r) }}
                </td>
                <td
                  v-for="col in layerColumns(layer)"
                  :key="col.key"
                  :class="{ 'text-right tabular': col.num }"
                >
                  <a
                    v-if="col.link && layer.level.id !== 'la'"
                    class="drill-link"
                    @click="drillInto(layers.length - 1, row)"
                  >
                    {{ row[col.key] }} <RightOutlined class="drill-link__icon" />
                  </a>
                  <span
                    v-else-if="col.status"
                    :class="['status', row[col.key] ? 'status--on' : 'status--off']"
                  >
                    {{ row[col.key] ? col.status[0] : col.status[1] }}
                  </span>
                  <template v-else-if="col.num">{{ fmt(row[col.key]) }}</template>
                  <template v-else>{{ row[col.key] || "-" }}</template>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="visibleRows(layer).length">
              <tr>
                <td>Total</td>
                <td
                  v-for="col in layerColumns(layer)"
                  :key="col.key"
                  :class="{ 'text-right tabular': col.num }"
                >
                  {{ col.num ? fmt(sumOf(visibleRows(layer), col.key)) : "" }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-if="visibleRows(layer).length > PAGE_SIZE" class="bd-pager">
          <a-pagination
            :current="pageNo(`bd-${layer.id}`, visibleRows(layer).length)"
            :page-size="PAGE_SIZE"
            :total="visibleRows(layer).length"
            :show-size-changer="false"
            size="small"
            @change="(p) => setPage(`bd-${layer.id}`, p)"
          />
        </div>
      </a-spin>
    </a-modal>
    <!-- ============ Business performance detail (Area / MO / Dealer) ============ -->
    <a-modal
      v-if="detailTop()"
      :open="true"
      :footer="null"
      :width="1040"
      centered
      :wrap-class-name="`bd-modal tone-${detailMeta(detailTop().kind).tone}`"
      @cancel="closeDetail"
    >
      <template #title>
        <div class="bd-title-row">
          <button
            v-if="detail.stack.length > 1"
            type="button"
            class="bd-back"
            title="Back"
            @click="detailBack"
          >
            <ArrowLeftOutlined />
          </button>
          <span v-else class="bd-title-icon"
            ><component :is="detailMeta(detailTop().kind).icon"
          /></span>
          <div class="min-w-0">
            <div class="bd-title">
              {{ detailTop().name }}
              <span v-if="detailTop().kind === 'dealer'" class="dt-code">{{
                detailTop().key
              }}</span>
            </div>
            <div class="bd-crumbs">
              <template v-for="(s, i) in detail.stack" :key="i">
                <span v-if="i" class="bd-crumbs__sep">›</span>
                <span :class="i === detail.stack.length - 1 ? 'bd-crumbs__current' : ''"
                  >{{ detailMeta(s.kind).label
                  }}{{ i < detail.stack.length - 1 ? `: ${s.name}` : "" }}</span
                >
              </template>
              <span class="bd-crumbs__sep">·</span>
              <span>{{ periodLabel() }}</span>
            </div>
          </div>
        </div>
      </template>

      <div class="dt-tiles">
        <div v-for="tile in detailTiles(detailTop())" :key="tile.label" class="dt-tile">
          <span class="dt-tile__label">{{ tile.label }}</span>
          <b class="dt-tile__value" :class="tile.cls">{{ tile.value }}</b>
          <span v-if="tile.sub" class="dt-tile__sub">{{ tile.sub }}</span>
        </div>
      </div>

      <template v-for="tabs in [detailTabs(detailTop())]" :key="detailTop().key">
        <div class="bd-head">
          <div class="dt-tabs">
            <button
              v-for="t in tabs"
              :key="t.id"
              type="button"
              class="dt-tab"
              :class="{ 'is-active': t.id === activeTabId(tabs) }"
              @click="selectDetailTab(t.id)"
            >
              {{ t.label }} <span class="dt-tab__count">{{ t.rows.length }}</span>
            </button>
          </div>
          <a-input-search
            v-model:value="detail.search"
            @change="setPage(dtPageId(tabs.find((t) => t.id === activeTabId(tabs))), 1)"
            placeholder="Search"
            allow-clear
            size="small"
            class="ml-auto"
            style="max-width: 220px"
          />
          <a-button v-if="canFilter(detailTop())" size="small" @click="filterFromDetail">
            <FilterOutlined /> Filter dashboard
          </a-button>
        </div>

        <template
          v-for="tab in [tabs.find((t) => t.id === activeTabId(tabs))]"
          :key="tab.id"
        >
          <div class="bd-table-wrap dt-table-wrap">
            <table class="bd-table">
              <thead>
                <tr>
                  <th class="w-10">#</th>
                  <th
                    v-for="col in tab.columns"
                    :key="col.key"
                    :class="{ 'text-right': col.type !== 'text' }"
                  >
                    {{ col.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!tabRows(tab).length">
                  <td
                    :colspan="tab.columns.length + 1"
                    class="text-center text-gray-400 py-6"
                  >
                    No data
                  </td>
                </tr>
                <tr
                  v-for="(row, r) in pageRows(dtPageId(tab), tabRows(tab))"
                  :key="row.key"
                >
                  <td class="text-gray-400">
                    {{ rowNo(dtPageId(tab), tabRows(tab).length, r) }}
                  </td>
                  <td
                    v-for="col in tab.columns"
                    :key="col.key"
                    :class="{ 'text-right tabular': col.type !== 'text' }"
                  >
                    <a
                      v-if="col.key === 'name' && tab.drill"
                      class="drill-link"
                      @click="openDetail(tab.drill, row.key, row.name)"
                    >
                      {{ row.name }} <RightOutlined class="drill-link__icon" />
                    </a>
                    <span
                      v-else-if="col.type === 'pct'"
                      class="dt-rate"
                      :class="rateLevel(row[col.key])"
                      >{{ cellText(col, row) }}</span
                    >
                    <template v-else>{{ cellText(col, row) }}</template>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="tabRows(tab).length">
                <tr>
                  <td>Total</td>
                  <td
                    v-for="col in tab.columns"
                    :key="col.key"
                    :class="{ 'text-right tabular': col.type !== 'text' }"
                  >
                    {{ totalCell(col, tabRows(tab)) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-if="tabRows(tab).length > PAGE_SIZE" class="bd-pager">
            <a-pagination
              :current="pageNo(dtPageId(tab), tabRows(tab).length)"
              :page-size="PAGE_SIZE"
              :total="tabRows(tab).length"
              :show-size-changer="false"
              size="small"
              @change="(p) => setPage(dtPageId(tab), p)"
            />
          </div>
        </template>
      </template>
    </a-modal>
  </MainLayout>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import dayjs from "dayjs";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { PieChart, LineChart, BarChart } from "echarts/charts";
import {
  TooltipComponent,
  TitleComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";
import {
  TeamOutlined,
  CheckCircleOutlined,
  MobileOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  ReloadOutlined,
  PieChartOutlined,
  TrophyOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RightOutlined,
  RiseOutlined,
  WalletOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  UserOutlined,
  SolutionOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  GlobalOutlined,
  ClusterOutlined,
  ArrowLeftOutlined,
  ExperimentOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  SearchOutlined,
  FileExcelOutlined,
  CaretUpFilled,
  FilterOutlined,
  CrownOutlined,
  RetweetOutlined,
  FieldTimeOutlined,
  AlertOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  StopOutlined,
  PercentageOutlined,
  CaretDownFilled,
} from "@ant-design/icons-vue";

use([
  PieChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  MarkPointComponent,
  MarkLineComponent,
  LegendComponent,
  CanvasRenderer,
  SVGRenderer, // Dealer-wise: full-height chart (thousands of rows) exceeds the canvas size limit
]);

// One object for the template, so vue-echarts doesn't dispose + re-create the chart
// on every render (it deep-watches init-options and re-inits on any new reference).
const SVG_INIT = { renderer: "svg" };

// Chart options: vue-echarts redraws the whole chart (setOption, notMerge) whenever
// it gets a new option object. memoBy() returns the same object until one of its
// sources changes by identity, so unrelated re-renders (loading flags, filter
// typing, paging) no longer redraw the charts. Plain function, not computed().
const memoBy = (sources, build) => {
  let last = null;
  let out;
  return () => {
    const now = sources();
    if (!last || now.some((v, i) => v !== last[i])) {
      last = now;
      out = build();
    }
    return out;
  };
};

// Backend endpoint that maps each dealer to its Area (Level2) and MO (Level1).
// Expected: { status: "success", data: [{ dealer_code, area_code, area_name, mo_code, mo_name }] }
const AREA_ENDPOINT = "dealer_area_mapping";
const router = useRouter();

// =====================================================================
// Raw data
// =====================================================================
const dealers = ref([]);
const staffCounts = reactive({ am: 0, mo: 0 });
const las = ref([]);
const areaRows = ref([]);
const products = ref([]); // product master: { code, name, portfolio }
const portfolios = ref([]); // product categories: { id, name }
const allSales = ref([]); // every LA purchase in the date range (unfiltered)
const allPrevSales = ref([]); // same-length range just before it
const sales = ref([]); // allSales narrowed by the applied filters
const prevSales = ref([]); // allPrevSales narrowed the same way, for trend %
// Dealers / LAs narrowed by Area, MO, Dealer and LA filters
const scopeDealers = ref([]);
const scopeLas = ref([]);
let stockEntries = []; // every stock entry { code, at, items }, oldest first
let stockCodes = null; // dealer codes in scope, or null for all

// Present stock as of each time in `points` (ascending):
// sum of each in-scope dealer's latest entry made on or before that time.
const stockSeries = (points) => {
  const latest = new Map();
  let total = 0;
  let i = 0;
  return points.map((t) => {
    for (; i < stockEntries.length && stockEntries[i].at <= t; i++) {
      const e = stockEntries[i];
      if (stockCodes && !stockCodes.has(e.code)) continue;
      total += e.items - (latest.get(e.code) ?? 0);
      latest.set(e.code, e.items);
    }
    return { total, dealers: latest.size };
  });
};

// How many items existed at each time in `points` (ascending).
// Items with no date are treated as always existing.
const countSeries = (items, timeOf, points) => {
  const times = items.map((x) => timeOf(x) ?? -Infinity).sort((a, b) => a - b);
  let i = 0;
  return points.map((t) => {
    while (i < times.length && times[i] <= t) i++;
    return i;
  });
};
const stock = reactive({ total: 0, dealers: 0 });
const loading = reactive({
  dealers: false,
  las: false,
  sales: false,
  stock: false,
  lower: false, // sp_GeneticsDashboard_Lower
  main: false, // sp_GeneticsDashboard
});
// Raw SP result sets from the last Apply Filter (used by Export Excel)
let lastMainSets = {};
let lastLowerSets = {};
// From sp_GeneticsDashboard
const kpi = ref(null); // RS1 · kpi — the 7 summary cards (1 row)
const kpiTrend = ref([]); // RS5 · trend — monthly rows, card sparklines
const bizArea = ref([]); // RS2 · area
const bizMo = ref([]); // RS3 · mo
const bizDealer = ref([]); // RS4 · dealer
// From sp_GeneticsDashboard_Lower
const topLas = ref([]); // RS1 · topLA  — Top Performing LAs
// Client-side paging shared by every dashboard table, keyed by a table id.
// Row numbers stay global across pages; the page is clamped when rows shrink.
const PAGE_SIZE = 10;
const pages = reactive({});
const pageNo = (id, total) =>
  Math.min(pages[id] || 1, Math.max(1, Math.ceil(total / PAGE_SIZE)));
const pageRows = (id, rows) => {
  const p = pageNo(id, rows.length);
  return rows.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
};
const rowNo = (id, total, i) => (pageNo(id, total) - 1) * PAGE_SIZE + i + 1;
const setPage = (id, p) => {
  pages[id] = p;
};
const resetPages = () => Object.keys(pages).forEach((k) => delete pages[k]);
const laSeg = ref(null); // RS2 · laSeg — LA Segmentation + Repeat vs One-Time (1 row)
const pfContrib = ref([]); // RS3 · portfolio — Portfolio Contribution
const topProducts = ref([]); // RS4 · topProducts — Top Products
const inventory = ref(null); // RS5 · inventory — Inventory & Stock Risk (1 row)
const payment = ref(null); // RS6 · payment — Dealer Payment cards (1 row)
const dueAging = ref([]); // RS7 · dueAging — Due Aging buckets (4 rows)
const dueDealers = ref([]); // RS8 · topDueDealers — Top Due Dealers
const areaState = reactive({ status: "idle" }); // idle | loading | ready | unavailable

let dealerByCode = new Map();
let areaByDealer = new Map();
let laById = new Map();
let productByCode = new Map();

const isOk = (res) => res?.data?.status === 1 || res?.data?.status === "success";
const str = (v) => String(v ?? "").trim();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isDealerUser = (u) =>
  (u?.roles ?? []).some((r) => /dealer/i.test(r?.name ?? "")) ||
  (!(u?.roles ?? []).length && !!str(u?.dealer_code));

// Date-ish value → epoch ms, or null when missing / unparseable.
const toTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

const normalizeDealer = (u) => ({
  code: str(u.dealer_code) || str(u.user_id) || `user-${u.id}`,
  name: u.name || u.shop_name || "-",
  shop: u.shop_name || "",
  mobile: u.mobile || "",
  active: u.active === "Y",
  registered: String(u.is_registered) === "1" || !!u.registration_date,
  createdAt: toTime(u.created_at ?? u.CreatedDate),
  registeredAt: toTime(u.registration_date),
});

const normalizeLa = (la) => ({
  id: la.LAID,
  name: la.LA || "-",
  mobile: str(la.MobileNo),
  district: la.DistrictName || str(la.DistrictCode) || "Unknown",
  upazilla: la.UpazillaName || str(la.UpazillaCode) || "Unknown",
  union: la.UnionName || str(la.UnionCode) || "",
  village: la.Village || "",
  dealerCode: str(la.DealerCode),
  dealerName: la.DealerName || "",
  active: la.Active === "Y",
  createdAt: toTime(la.CreatedDate),
});

// One LA purchase line from la_buying_seman_list.
// Sales value = Payment + Due (what the LA was billed after discount).
const normalizeSale = (r) => {
  const payment = num(r.Payment);
  const due = num(r.Due);
  return {
    laid: str(r.LAID),
    laName: r.LA || "-",
    date: r.BuyingDate ? new Date(r.BuyingDate) : null,
    productCode: str(r.ProductCode),
    product: r.ProductName || str(r.ProductCode) || "Unknown",
    qty: num(r.Quantity),
    bonus: num(r.BonusQty),
    payment,
    due,
    value: payment + due,
  };
};

const indexData = () => {
  dealerByCode = new Map(dealers.value.map((d) => [d.code, d]));
  areaByDealer = new Map(areaRows.value.map((r) => [r.dealerCode, r]));
  laById = new Map(las.value.map((l) => [str(l.id), l]));
  productByCode = new Map(products.value.map((p) => [p.code, p]));
};

// =====================================================================
// Filters
// `filters` is what the bar shows; `applied` is what the dashboard uses.
// =====================================================================
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const DAY = 86400000;

const defaultRange = () => [dayjs().startOf("month"), dayjs().startOf("day")];
const blankFilters = () => ({
  range: defaultRange(),
  area: undefined,
  mo: undefined,
  dealer: undefined,
  la: undefined,
  product: undefined,
  portfolio: undefined,
});
const filters = reactive(blankFilters());
const applied = reactive(blankFilters());

// { from, to } Date range that is applied, plus the equal-length range before it.
const periodRange = () => {
  const from = applied.range[0].startOf("day").toDate();
  const to = applied.range[1].startOf("day").toDate();
  const days = Math.round((to - from) / DAY) + 1;
  const prevTo = new Date(from.getTime() - DAY);
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * DAY);
  return { from, to, prevFrom, prevTo, days };
};

const periodLabel = () =>
  `${applied.range[0].format("DD MMM YYYY")} – ${applied.range[1].format("DD MMM YYYY")}`;
const prevLabel = () => "vs Previous Period";

// ---------------- Scope tests (always against `applied`, unless given) ----------------
const portfolioOf = (code) => productByCode.get(code)?.portfolio ?? "";

const dealerInScope = (code, f = applied) => {
  if (f.dealer && code !== f.dealer) return false;
  if (f.area || f.mo) {
    const a = areaByDealer.get(code);
    if (!a) return false;
    if (f.area && a.areaKey !== f.area) return false;
    if (f.mo && a.moKey !== f.mo) return false;
  }
  return true;
};
const laInScope = (la, f = applied) =>
  (!f.la || str(la.id) === f.la) && dealerInScope(la.dealerCode, f);

const saleInScope = (r) => {
  const f = applied;
  if (f.product && r.productCode !== f.product) return false;
  if (f.portfolio && portfolioOf(r.productCode) !== f.portfolio) return false;
  if (f.la && r.laid !== f.la) return false;
  if (f.area || f.mo || f.dealer) {
    const la = laById.get(r.laid);
    if (!la || !dealerInScope(la.dealerCode)) return false;
  }
  return true;
};

const hasNetworkFilter = () =>
  !!(applied.area || applied.mo || applied.dealer || applied.la);

// Rebuild the dealer / LA / stock scope and re-filter sales from the loaded data.
const applyScope = () => {
  const laDealer = applied.la ? laById.get(applied.la)?.dealerCode : null;
  scopeDealers.value = hasNetworkFilter()
    ? dealers.value.filter(
        (d) => dealerInScope(d.code) && (!applied.la || d.code === laDealer)
      )
    : dealers.value;
  scopeLas.value = hasNetworkFilter() ? las.value.filter((l) => laInScope(l)) : las.value;

  stockCodes = hasNetworkFilter() ? new Set(scopeDealers.value.map((d) => d.code)) : null;
  const [now] = stockSeries([Infinity]);
  stock.total = now.total;
  stock.dealers = now.dealers;

  sales.value = allSales.value.filter(saleInScope);
  prevSales.value = allPrevSales.value.filter(saleInScope);
  rebuildSales();
};

// ---------------- Select options (sp_GeneticsDashboard_Filters) ----------------
// Every dropdown list comes from the Filters SP, one @Type per list.
// Network cascade is strict: AM → MO → Dealer → LA (each needs its parent picked).
// Portfolio → Product narrows the product list (product works without a portfolio too).
const filterOpts = reactive({ area: [], mo: [], dealer: [], la: [], product: [], portfolio: [] });
const filterLoading = reactive({ area: false, mo: false, dealer: false, la: false, product: false, portfolio: false });

// filter key → SP @Type, its parents, and how a SP row becomes an option
const FILTER_SP = {
  area: { type: "AM", row: (r) => ({ value: r.AM, label: r.AMName }) },
  mo: { type: "MO", row: (r) => ({ value: r.MO, label: r.MOName }) },
  dealer: { type: "DEALER", row: (r) => ({ value: r.DealerCode, label: `${r.DealerName} (${r.DealerCode})` }) },
  la: { type: "LA", row: (r) => ({ value: String(r.LAID), label: r.MobileNo ? `${r.LA} · ${r.MobileNo}` : r.LA }) },
  portfolio: { type: "PORTFOLIO", row: (r) => ({ value: String(r.CategoryID), label: r.Category }) },
  product: { type: "PRODUCT", row: (r) => ({ value: r.ProductCode, label: r.ProductName }) },
};
// The SP parameters for one list, from the current (not yet applied) filters.
const filterParams = () => ({
  am: filters.area || null,
  mo: filters.mo || null,
  dealer_code: filters.dealer || null,
  category_id: filters.portfolio ? Number(filters.portfolio) : null,
});

// Lists already fetched during this visit, keyed by the exact request, so going
// back to an earlier AM / MO / Dealer / Category (or Reset) needs no new request.
// Failed requests are not cached.
const filterCache = new Map();
const cacheKey = (type, params) => JSON.stringify([type, params]);

const filterSeq = {};
const loadFilterOptions = async (key) => {
  const seq = (filterSeq[key] = (filterSeq[key] ?? 0) + 1);
  const { type, row } = FILTER_SP[key];
  const params = filterParams();
  const ck = cacheKey(type, params);
  if (filterCache.has(ck)) {
    filterOpts[key] = filterCache.get(ck);
    filterLoading[key] = false;
    return;
  }
  filterLoading[key] = true;
  try {
    const res = await axios.post(
      `${apiBase}/genetics_dashboard_filters`,
      { type, ...params },
      getTokenConfig()
    );
    const opts = isOk(res) ? (res.data.data ?? []).map(row) : [];
    if (isOk(res)) filterCache.set(ck, opts);
    if (seq !== filterSeq[key]) return;
    filterOpts[key] = opts;
  } catch (err) {
    if (seq !== filterSeq[key]) return;
    filterOpts[key] = [];
  } finally {
    if (seq === filterSeq[key]) filterLoading[key] = false;
  }
};

// Each dropdown lists at most MAX_FILTER_ITEMS options; typing searches the full
// list. The picked option always stays in the list so its label shows.
const MAX_FILTER_ITEMS = 20;
const filterSearch = reactive({ area: "", mo: "", dealer: "", la: "", product: "", portfolio: "" });
const visibleOptions = (key) => {
  const q = filterSearch[key].trim().toLowerCase();
  const all = filterOpts[key];
  const matches = q ? all.filter((o) => String(o.label).toLowerCase().includes(q)) : all;
  const shown = matches.slice(0, MAX_FILTER_ITEMS);
  const picked = all.find((o) => o.value === filters[key]);
  if (picked && !shown.includes(picked)) shown.unshift(picked);
  return { options: shown, total: matches.length, hidden: matches.length > MAX_FILTER_ITEMS };
};

const filterFields = () => {
  const f = filters;
  return [
    { key: "area", label: "AM", placeholder: "All AMs", disabled: false },
    { key: "mo", label: "MO", placeholder: f.area ? "All MOs" : "Select AM first", disabled: !f.area },
    { key: "dealer", label: "Dealer", placeholder: f.mo ? "All Dealers" : "Select MO first", disabled: !f.mo },
    { key: "la", label: "LA", placeholder: f.dealer ? "All LAs" : "Select Dealer first", disabled: !f.dealer },
    { key: "portfolio", label: "Categories", placeholder: "All Categories", disabled: false },
    { key: "product", label: "Product", placeholder: "All Products", disabled: false },
  ].map((x) => ({ ...x, ...visibleOptions(x.key), loading: filterLoading[x.key] }));
};

// Changing a parent clears its children, then reloads the next level from the SP.
const CHILDREN = {
  area: ["mo", "dealer", "la"],
  mo: ["dealer", "la"],
  dealer: ["la"],
  portfolio: ["product"],
};
const NEXT_LEVEL = { area: "mo", mo: "dealer", dealer: "la" };
const onFilterChange = (key) => {
  filterSearch[key] = "";
  for (const child of CHILDREN[key] ?? []) {
    filters[child] = undefined;
    if (child !== "product") filterOpts[child] = [];
  }
  const next = NEXT_LEVEL[key];
  if (next && filters[key]) loadFilterOptions(next);
  if (key === "portfolio") loadFilterOptions("product");
};
// Lists that need no parent: AM, Portfolio, Product — fetched in one request
// (`types`), each with the same parameters a single-list request would send.
const ROOT_FILTERS = ["area", "portfolio", "product"];
const loadRootFilterOptions = async () => {
  const params = filterParams();
  const seqs = {};
  for (const k of ROOT_FILTERS) {
    seqs[k] = filterSeq[k] = (filterSeq[k] ?? 0) + 1;
    filterLoading[k] = true;
  }
  let sets = null;
  try {
    const res = await axios.post(
      `${apiBase}/genetics_dashboard_filters`,
      { types: ROOT_FILTERS.map((k) => FILTER_SP[k].type), ...params },
      getTokenConfig()
    );
    const data = res?.data?.data;
    if (isOk(res) && data && !Array.isArray(data)) sets = data;
  } catch (err) {
    sets = null;
  }
  // Older API without `types`: fall back to one request per list.
  if (!sets) {
    await Promise.all(ROOT_FILTERS.map((k) => loadFilterOptions(k)));
    return;
  }
  for (const k of ROOT_FILTERS) {
    const { type, row } = FILTER_SP[k];
    const opts = (sets[type] ?? []).map(row);
    filterCache.set(cacheKey(type, params), opts);
    if (seqs[k] !== filterSeq[k]) continue;
    filterOpts[k] = opts;
    filterLoading[k] = false;
  }
};

const sameDay = (a, b) => a && b && a.isSame(b, "day");

// Every Apply re-runs both dashboard SPs with the selected filters (no cached data).
// No filter selected → the SPs get NULLs and return their default (all) data.
const applyFilters = () => {
  Object.assign(applied, { ...filters, range: [...filters.range] });
  fetchMain();
  fetchLower();
};

const resetFilters = () => {
  Object.assign(filters, blankFilters());
  for (const k of ["mo", "dealer", "la"]) filterOpts[k] = [];
  loadFilterOptions("product"); // back to every product
  applyFilters();
};

// =====================================================================
// Fetching
// =====================================================================
const fetchDealers = async () => {
  loading.dealers = true;
  try {
    const res = await axios.get(`${apiBase}/user_list`, getTokenConfig());
    const users = Array.isArray(res?.data?.users) ? res.data.users : [];
    dealers.value = users.filter(isDealerUser).map(normalizeDealer);
    const hasRole = (u, name) =>
      (u?.roles ?? []).some((r) => str(r?.name).toUpperCase() === name);
    staffCounts.am = users.filter((u) => hasRole(u, "AM")).length;
    staffCounts.mo = users.filter((u) => hasRole(u, "MO")).length;
  } catch (err) {
    dealers.value = [];
    staffCounts.am = 0;
    staffCounts.mo = 0;
    showNotification("error", "Failed to load dealers");
  } finally {
    loading.dealers = false;
  }
};

const fetchLas = async () => {
  loading.las = true;
  try {
    const res = await axios.get(`${apiBase}/la_info_manage`, {
      ...getTokenConfig(),
      params: { export: 1 },
    });
    las.value = isOk(res) ? (res.data.data ?? []).map(normalizeLa) : [];
  } catch (err) {
    las.value = [];
    showNotification("error", "Failed to load LA info");
  } finally {
    loading.las = false;
  }
};

const postSales = async (from, to) => {
  const res = await axios.post(
    `${apiBase}/la_buying_seman_list`,
    { laid: "", from_date: ymd(from), to_date: ymd(to) },
    getTokenConfig()
  );
  return Array.isArray(res?.data?.data) ? res.data.data.map(normalizeSale) : [];
};

// Ignores responses from a superseded period click.
let salesSeq = 0;
const fetchSales = async () => {
  const seq = ++salesSeq;
  loading.sales = true;
  const { from, to, prevFrom, prevTo } = periodRange();
  try {
    const [cur, prev] = await Promise.allSettled([
      postSales(from, to),
      postSales(prevFrom, prevTo),
    ]);
    if (seq !== salesSeq) return;
    allSales.value = cur.status === "fulfilled" ? cur.value : [];
    allPrevSales.value = prev.status === "fulfilled" ? prev.value : [];
    if (cur.status === "rejected") showNotification("error", "Failed to load sales");
  } finally {
    if (seq === salesSeq) {
      loading.sales = false;
      applyScope();
    }
  }
};

// =====================================================================
// SP display rule: every SP value is shown exactly as the SP returns it
// (e.g. "10750.00") — no rounding, no thousand separators, no K / L / Cr.
// Values are kept as the SP's strings; num() is used only where a chart
// needs a bar length or a colour needs a comparison.
// =====================================================================
const spText = (v) => (v === null || v === undefined ? "-" : String(v));
const spPct = (v) => (v === null || v === undefined ? "-" : `${v}%`);
// Date part of the SP's datetime, as returned: "2026-11-10 07:44:23.987" → "2026-11-10"
const spDate = (v) => (v === null || v === undefined ? "-" : String(v).split(/[ T]/)[0]);

// ---------------- Top Performing LAs (sp_GeneticsDashboard_Lower) ----------------
// Every field comes straight from the SP's topLA set (RS1) — nothing else.
const normalizeTopLa = (r) => ({
  key: r.LAID,
  name: r.LAName,
  dealerCode: r.DealerCode,
  value: r.SalesValue,
  days: r.ActiveDays,
  products: r.ProductCount,
  mix: r.ProductMix,
  repeatPct: r.RepeatPurchasePct,
  due: r.Due,
});

// ---------------- LA Segmentation + Repeat vs One-Time (SP laSeg, RS2) ----------------
// One row; counts and % come straight from the SP. Every % is of TotalLAs (active LAs),
// except the donut %, which the SP gives as a share of buying LAs.
const LA_SEG_TILES = [
  { id: "high", label: "High Value", field: "HighValueLA", hint: "Sales at or above the average of buying LAs", icon: CrownOutlined, c: "#16a34a" },
  { id: "repeat", label: "Repeat LA", field: "RepeatLA", hint: "Bought on 2 or more days", icon: RetweetOutlined, c: "#2563eb" },
  { id: "onetime", label: "One-Time LA", field: "OneTimeLA", hint: "Bought on a single day", icon: UserOutlined, c: "#ca8a04" },
  { id: "nobuy", label: "No Purchase", field: "InactiveLA", hint: "Active LAs with no purchase in this period", icon: FieldTimeOutlined, c: "#475569" },
  { id: "priority", label: "Collection Priority", field: "CollectionPriorityLA", hint: "Have due and lifetime collection under 70%", icon: AlertOutlined, c: "#7c3aed" },
];
const laSegTiles = () =>
  LA_SEG_TILES.map((t) => ({
    ...t,
    count: spText(laSeg.value[t.field]),
    pct: spPct(laSeg.value[`${t.field}_Pct`]),
  }));

const repeatParts = () => [
  { id: "repeat", label: "Repeat LA", color: "#2563eb", count: laSeg.value?.RepeatLA, pct: laSeg.value?.Donut_RepeatPct },
  { id: "onetime", label: "One-Time LA", color: "#eab308", count: laSeg.value?.OneTimeLA, pct: laSeg.value?.Donut_OneTimePct },
];
const hasBuyers = () => repeatParts().some((p) => num(p.count) > 0);

const repeatOption = memoBy(() => [laSeg.value], () => {
  const parts = repeatParts();
  return {
    tooltip: {
      ...TOOLTIP,
      trigger: "item",
      formatter: (p) => {
        const part = parts[p.dataIndex];
        return `<b>${part.label}</b><br/>${spText(part.count)} LAs (${spPct(part.pct)})`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["64%", "88%"],
        padAngle: 2,
        itemStyle: { borderRadius: 6 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
        data: parts.map((p) => ({
          name: p.label,
          value: num(p.count),
          itemStyle: { color: p.color },
        })),
      },
    ],
  };
});

// ---------------- Portfolio Contribution (SP portfolio, RS3) ----------------
// SP NULLs stay null and show as "-".
const spNum = (v) => (v === null || v === undefined ? null : num(v));
const normalizePortfolio = (r, i) => ({
  key: r.CategoryID ?? r.Portfolio,
  categoryId: r.CategoryID ?? null,
  name: r.Portfolio,
  value: r.Sales,
  share: r.SharePct,
  activeLas: r.ActiveLAs,
  growth: r.GrowthPct,
  rate: r.CollectionPct,
  color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
});

// ---------------- Top Products (SP topProducts, RS4) ----------------
const normalizeTopProduct = (r) => ({
  key: r.ProductCode,
  name: r.ProductName,
  value: r.Sales,
  activeLas: r.ActiveLA,
  growth: r.GrowthPct,
  rate: r.CollectionPct,
  share: r.SharePct,
  due: r.Due,
  status: r.Status,
});
// Colour only: the SP's status text → the existing chip style
const STATUS_CLS = {
  "Core Growth Engine": "st--core",
  "Emerging Growth": "st--emerging",
  "Maintain / Monitor": "st--maintain",
  "Collection Watch": "st--watch",
};
const statusCls = (status) => STATUS_CLS[status] ?? "";

// ---------------- Top Due Dealers (SP topDueDealers, RS8) ----------------
const normalizeDueDealer = (r) => ({
  key: r.DealerCode,
  name: r.DealerName,
  area: r.Area,
  mo: r.MO,
  due: r.Due,
  lastPay: r.LastPayment,
  age: r.DueAgeDays,
  status: r.Status,
});
// Colour only: the SP's status text → the existing age / status chip styles
const DUE_STATUS_ID = { Critical: "critical", Watch: "attention", Normal: "normal" };
const dueStatusCls = (prefix, status) =>
  DUE_STATUS_ID[status] ? `${prefix}--${DUE_STATUS_ID[status]}` : "";

// Ignores responses from a superseded filter change.
let lowerSeq = 0;
const fetchLower = async () => {
  const seq = ++lowerSeq;
  loading.lower = true;
  const { from, to } = periodRange();
  const f = applied;
  try {
    const res = await axios.post(
      `${apiBase}/genetics_dashboard_lower`,
      {
        from_date: ymd(from),
        to_date: ymd(to),
        am: f.area || null,
        mo: f.mo || null,
        dealer_code: f.dealer || null,
        laid: f.la ? Number(f.la) : null,
        product_code: f.product || null,
        category_id: f.portfolio ? Number(f.portfolio) : null,
      },
      getTokenConfig()
    );
    if (seq !== lowerSeq) return;
    const sets = isOk(res) ? res.data.data ?? {} : {};
    lastLowerSets = sets;
    topLas.value = (sets.topLA ?? []).map(normalizeTopLa);
    resetPages();
    laSeg.value = sets.laSeg?.[0] ?? null;
    pfContrib.value = (sets.portfolio ?? []).map(normalizePortfolio);
    topProducts.value = (sets.topProducts ?? []).map(normalizeTopProduct);
    inventory.value = sets.inventory?.[0] ?? null;
    payment.value = sets.payment?.[0] ?? null;
    dueAging.value = sets.dueAging ?? [];
    dueDealers.value = (sets.topDueDealers ?? []).map(normalizeDueDealer);
  } catch (err) {
    if (seq !== lowerSeq) return;
    lastLowerSets = {};
    topLas.value = [];
    laSeg.value = null;
    pfContrib.value = [];
    topProducts.value = [];
    inventory.value = null;
    payment.value = null;
    dueAging.value = [];
    dueDealers.value = [];
    showNotification("error", "Failed to load dashboard data");
  } finally {
    if (seq === lowerSeq) loading.lower = false;
  }
};

// sp_GeneticsDashboard → Business Performance (Area / MO / Dealer)
let mainSeq = 0;
const fetchMain = async () => {
  const seq = ++mainSeq;
  loading.main = true;
  const { from, to } = periodRange();
  const f = applied;
  try {
    const res = await axios.post(
      `${apiBase}/genetics_dashboard`,
      {
        from_date: ymd(from),
        to_date: ymd(to),
        am: f.area || null,
        mo: f.mo || null,
        dealer_code: f.dealer || null,
        laid: f.la ? Number(f.la) : null,
        product_code: f.product || null,
        category_id: f.portfolio ? Number(f.portfolio) : null,
      },
      getTokenConfig()
    );
    if (seq !== mainSeq) return;
    const sets = isOk(res) ? res.data.data ?? {} : {};
    lastMainSets = sets;
    kpi.value = sets.kpi?.[0] ?? null;
    kpiTrend.value = sets.trend ?? [];
    bizArea.value = (sets.area ?? []).map(normalizeBizArea);
    bizMo.value = (sets.mo ?? []).map(normalizeBizMo);
    bizDealer.value = (sets.dealer ?? []).map(normalizeBizDealer);
  } catch (err) {
    if (seq !== mainSeq) return;
    lastMainSets = {};
    kpi.value = null;
    kpiTrend.value = [];
    bizArea.value = [];
    bizMo.value = [];
    bizDealer.value = [];
    showNotification("error", "Failed to load business performance");
  } finally {
    if (seq === mainSeq) loading.main = false;
  }
};

// Product master + categories (= portfolios) for the Product / Portfolio filters.
const fetchProducts = async () => {
  try {
    const res = await axios.get(`${apiBase}/product`, getTokenConfig());
    products.value = isOk(res)
      ? (res.data.data ?? []).map((p) => ({
          code: str(p.ProductCode),
          name: p.ProductName || str(p.ProductCode),
          portfolio: str(p.CategoryID ?? p.category?.CategoryID),
        }))
      : [];
  } catch (err) {
    products.value = [];
  }
};

const fetchPortfolios = async () => {
  try {
    const res = await axios.get(`${apiBase}/product_category`, getTokenConfig());
    portfolios.value = isOk(res)
      ? (res.data.data ?? []).map((c) => ({
          id: str(c.CategoryID),
          name: c.Category || "-",
        }))
      : [];
  } catch (err) {
    portfolios.value = [];
  }
};

// Present stock = latest stock entry per dealer.
const fetchStock = async () => {
  loading.stock = true;
  try {
    const res = await axios.post(
      `${apiBase}/stock_entry_report`,
      { created_by: null, created_date: null },
      getTokenConfig()
    );
    const rows = isOk(res) ? res.data.data ?? [] : [];
    stockEntries = rows
      .map((r) => ({
        code: str(r.DealerCode),
        at: toTime(r.CreatedDate) ?? 0,
        items: num(r.TotalItems),
      }))
      .sort((a, b) => a.at - b.at);
  } catch (err) {
    stockEntries = [];
  } finally {
    loading.stock = false;
  }
};

const fetchAreaMapping = async () => {
  if (areaState.status === "ready" || areaState.status === "loading") return;
  areaState.status = "loading";
  try {
    const res = await axios.get(`${apiBase}/${AREA_ENDPOINT}`, getTokenConfig());
    if (!isOk(res) || !Array.isArray(res.data.data)) throw new Error("bad response");
    areaRows.value = res.data.data.map((r) => ({
      dealerCode: str(r.dealer_code),
      areaKey: str(r.area_code) || str(r.area_name),
      areaLabel: r.area_name || str(r.area_code),
      moKey: str(r.mo_code) || str(r.mo_name),
      moLabel: r.mo_name || str(r.mo_code),
    }));
    areaState.status = "ready";
  } catch (err) {
    areaRows.value = [];
    areaState.status = "unavailable";
  }
  indexData();
};

const loadAll = async () => {
  layers.value = [];
  // Everything on the page comes from the SPs:
  //   dropdowns  → sp_GeneticsDashboard_Filters
  //   dashboard  → sp_GeneticsDashboard + sp_GeneticsDashboard_Lower
  await Promise.all([loadRootFilterOptions(), fetchMain(), fetchLower()]);
};

const isLoadingAny = () =>
  loading.dealers || loading.las || loading.sales || loading.stock;

// =====================================================================
// Formatting
// =====================================================================
const fmt = (n) => (Number(n) || 0).toLocaleString("en-US");
const pctNum = (part, total) => (total ? Math.round((part / total) * 100) : 0);
const pct = (part, total) => `${pctNum(part, total)}%`;
const sumOf = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
// Short taka format: 1.2 Cr / 36.5 L / 12,300
const money = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(1)} L`;
  return fmt(Math.round(v));
};
const change = (value, prev) => (prev ? ((value - prev) / prev) * 100 : 0);
// Green when the move is good (e.g. sales up, due down), amber when it is not.
const trendClass = (t) => [
  "trend",
  t.value >= t.prev === t.goodWhenUp ? "trend--good" : "trend--bad",
];
const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// =====================================================================
// Sales aggregation — rebuilt imperatively after fetch / filter change
// =====================================================================
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const selectedDistrict = ref(null);
const trendMetric = ref("qty");
const rankMetric = ref("qty");
const METRICS = [
  { id: "qty", label: "Straws" },
  { id: "value", label: "Value" },
];

const emptyTotals = () => ({
  qty: 0,
  bonus: 0,
  value: 0,
  payment: 0,
  due: 0,
  buyingLas: 0,
  dueLas: 0,
  lines: 0,
});
const agg = reactive({
  totals: emptyTotals(),
  prev: emptyTotals(),
  trend: {
    labels: [],
    tips: [],
    ends: [],
    qty: [],
    value: [],
    payment: [],
    due: [],
    monthly: false,
  },
  districts: [],
  products: [],
  topLas: [],
  topDealers: [],
  dueLas: [],
  areas: [],
  mos: [],
  dealerPerf: [],
  laStats: [],
  segments: [],
  productPerf: [],
  portfolioPerf: [],
  stockRows: [],
  stockRisk: { low: 0, lowUnits: 0, zero: 0, stale: 0, lastUpdate: null, prevTotal: 0 },
  aging: [],
  dueDealers: [],
});

const totalsOf = (rows) => {
  const t = emptyTotals();
  const buyers = new Set();
  const dueBy = new Map();
  for (const r of rows) {
    t.qty += r.qty;
    t.bonus += r.bonus;
    t.value += r.value;
    t.payment += r.payment;
    t.due += r.due;
    t.lines += 1;
    buyers.add(r.laid);
    dueBy.set(r.laid, (dueBy.get(r.laid) ?? 0) + r.due);
  }
  t.buyingLas = buyers.size;
  t.dueLas = [...dueBy.values()].filter((d) => d > 0).length;
  return t;
};

const districtOf = (r) => laById.get(r.laid)?.district ?? "Unmapped";

// Daily buckets for up to ~3 months, monthly buckets for longer ranges.
const buildTrend = (rows) => {
  const { from, to, days } = periodRange();
  const monthly = days > 92;
  const multiYear = from.getFullYear() !== to.getFullYear();
  const labels = [];
  const tips = [];
  const ends = []; // last moment of each bucket (ms), for "as of" series
  const toEnd = to.getTime() + DAY - 1;
  const index = new Map();
  if (monthly) {
    for (
      let d = new Date(from.getFullYear(), from.getMonth(), 1);
      d <= to;
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    ) {
      const y = d.getFullYear();
      const m = d.getMonth();
      index.set(`${y}-${m}`, labels.length);
      labels.push(multiYear ? `${MONTHS[m]} ${String(y).slice(2)}` : MONTHS[m]);
      tips.push(`${MONTHS[m]} ${y}`);
      ends.push(Math.min(new Date(y, m + 1, 1).getTime() - 1, toEnd));
    }
  } else {
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + DAY)) {
      index.set(ymd(d), labels.length);
      labels.push(`${d.getDate()} ${MONTHS[d.getMonth()]}`);
      tips.push(`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
      ends.push(d.getTime() + DAY - 1);
    }
  }
  const qty = labels.map(() => 0);
  const value = labels.map(() => 0);
  const payment = labels.map(() => 0);
  const due = labels.map(() => 0);
  for (const r of rows) {
    if (!r.date || Number.isNaN(r.date.getTime())) continue;
    const key = monthly ? `${r.date.getFullYear()}-${r.date.getMonth()}` : ymd(r.date);
    const i = index.get(key);
    if (i === undefined) continue;
    qty[i] += r.qty;
    value[i] += r.value;
    payment[i] += r.payment;
    due[i] += r.due;
  }
  return { labels, tips, ends, qty, value, payment, due, monthly };
};

const groupBy = (rows, keyFn) => {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
};

const rebuildSales = () => {
  const rows = sales.value;
  agg.totals = totalsOf(rows);
  agg.prev = totalsOf(prevSales.value);

  agg.trend = buildTrend(
    selectedDistrict.value
      ? rows.filter((r) => districtOf(r) === selectedDistrict.value)
      : rows
  );

  agg.districts = [...groupBy(rows, districtOf).entries()]
    .map(([name, list]) => ({
      name,
      ...totalsOf(list),
      las: new Set(list.map((r) => r.laid)).size,
    }))
    .sort((a, b) => b.qty - a.qty);

  agg.products = [...groupBy(rows, (r) => r.product).entries()]
    .map(([name, list]) => ({
      name,
      qty: sumOf(list, "qty"),
      value: sumOf(list, "value"),
    }))
    .sort((a, b) => b.qty - a.qty);

  const byLa = [...groupBy(rows, (r) => r.laid).entries()].map(([laid, list]) => {
    const la = laById.get(laid);
    return {
      key: laid,
      name: la?.name ?? list[0].laName,
      meta: la ? `${la.upazilla}, ${la.district}` : "",
      dealerCode: la?.dealerCode ?? "",
      qty: sumOf(list, "qty"),
      due: sumOf(list, "due"),
    };
  });
  agg.topLas = [...byLa].sort((a, b) => b.qty - a.qty).slice(0, 10);
  agg.dueLas = byLa
    .filter((l) => l.due > 0)
    .sort((a, b) => b.due - a.due)
    .slice(0, 10);

  agg.topDealers = [
    ...groupBy(
      byLa.filter((l) => l.dealerCode),
      (l) => l.dealerCode
    ).entries(),
  ]
    .map(([code, list]) => ({
      key: code,
      name: dealerByCode.get(code)?.name ?? laById.get(list[0].key)?.dealerName ?? code,
      meta: `${list.length} buying LA${list.length === 1 ? "" : "s"}`,
      qty: sumOf(list, "qty"),
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  buildBusiness(rows);
  buildEngagement(rows);
  buildRisk(rows);
};

// =====================================================================
// Business performance: Area / MO / Dealer
// =====================================================================
const HIERARCHY = ["Area", "MO", "Dealer", "LA", "Product"];
const BIZ_COLORS = [
  "#2563eb",
  "#10b981",
  "#6366f1",
  "#06b6d4",
  "#8b5cf6",
  "#14b8a6",
  "#84cc16",
  "#0ea5e9",
  "#eab308",
  "#64748b",
];

const dealerCodeOfSale = (r) => laById.get(r.laid)?.dealerCode ?? "";
const areaReady = () => areaState.status === "ready";
// Area of a sale; falls back to the LA's district while the area mapping is missing.
const areaOfSale = (r) => {
  if (!areaReady()) {
    const d = districtOf(r);
    return [d, d];
  }
  const a = areaByDealer.get(dealerCodeOfSale(r));
  return a ? [a.areaKey, a.areaLabel] : ["unmapped", "Unmapped"];
};
const moOfSale = (r) => {
  const a = areaByDealer.get(dealerCodeOfSale(r));
  return a ? [a.moKey, a.moLabel] : ["unmapped", "Unmapped"];
};

// Latest stock entry per dealer: code → { items, at }
const latestStockByDealer = () => {
  const map = new Map();
  for (const e of stockEntries) map.set(e.code, { items: e.items, at: e.at });
  return map;
};

const rollup = (rows, keyFn) => {
  const map = new Map();
  for (const r of rows) {
    const [key, name] = keyFn(r);
    if (!map.has(key))
      map.set(key, {
        key,
        name,
        value: 0,
        payment: 0,
        due: 0,
        qty: 0,
        buyers: new Set(),
      });
    const g = map.get(key);
    g.value += r.value;
    g.payment += r.payment;
    g.due += r.due;
    g.qty += r.qty;
    g.buyers.add(r.laid);
  }
  return map;
};

const buildBusiness = (rows) => {
  // ---- Area (or district) with growth vs previous period ----
  const prevByArea = rollup(prevSales.value, areaOfSale);
  agg.areas = [...rollup(rows, areaOfSale).values()]
    .map(({ buyers, ...g }) => {
      const prev = prevByArea.get(g.key)?.value ?? 0;
      return {
        ...g,
        buyingLas: buyers.size,
        prev,
        growth: prev ? change(g.value, prev) : null,
      };
    })
    .sort((a, b) => b.value - a.value);

  // ---- MO ----
  if (areaReady()) {
    const dealersByMo = new Map();
    for (const d of scopeDealers.value) {
      const a = areaByDealer.get(d.code);
      const k = a?.moKey || "unmapped";
      dealersByMo.set(k, (dealersByMo.get(k) ?? 0) + 1);
    }
    const activeLasByMo = new Map();
    for (const l of scopeLas.value) {
      if (!l.active) continue;
      const k = areaByDealer.get(l.dealerCode)?.moKey || "unmapped";
      activeLasByMo.set(k, (activeLasByMo.get(k) ?? 0) + 1);
    }
    agg.mos = [...rollup(rows, moOfSale).values()]
      .map(({ buyers, ...g }) => ({
        ...g,
        buyingLas: buyers.size,
        dealers: dealersByMo.get(g.key) ?? 0,
        activeLas: activeLasByMo.get(g.key) ?? 0,
        rate: g.value ? (g.payment / g.value) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  } else {
    agg.mos = [];
  }

  // ---- Dealer ----
  const stockNow = latestStockByDealer();
  const activeLasByDealer = new Map();
  for (const l of scopeLas.value)
    if (l.active)
      activeLasByDealer.set(l.dealerCode, (activeLasByDealer.get(l.dealerCode) ?? 0) + 1);
  agg.dealerPerf = [
    ...rollup(
      rows.filter((r) => dealerCodeOfSale(r)),
      (r) => {
        const code = dealerCodeOfSale(r);
        return [
          code,
          dealerByCode.get(code)?.name ?? laById.get(r.laid)?.dealerName ?? code,
        ];
      }
    ).values(),
  ]
    .map(({ buyers, ...g }) => ({
      ...g,
      buyingLas: buyers.size,
      activeLas: activeLasByDealer.get(g.key) ?? 0,
      inventory: stockNow.get(g.key)?.items ?? null,
      lastUpdate: stockNow.get(g.key)?.at || null,
      rate: g.value ? (g.payment / g.value) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Compact rows; the box around the chart scrolls past ~260px.
const barHeight = (n, per = 28) => `${Math.max(n, 3) * per + 8}px`;
// g = the SP's GrowthPct string, shown as returned (NULL → "-")
const growthText = (g) =>
  g === null || g === undefined
    ? "{na|-}"
    : num(g) >= 0
    ? `{up|▲ ${g}%}`
    : `{down|▼ ${g}%}`;
const shortDate = (ms) =>
  ms
    ? new Date(ms).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
const TOOLTIP = {
  // Render on <body> so the scroll boxes around the charts can't clip it
  appendToBody: true,
  backgroundColor: "rgba(15,23,42,0.92)",
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: "#fff", fontSize: 12 },
};
const tipRow = (label, value) =>
  `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#cbd5e1">${label}</span><b>${value}</b></div>`;
const nameAxis = (names, width) => ({
  type: "category",
  inverse: true,
  data: names,
  axisTick: { show: false },
  axisLine: { show: false },
  axisLabel: { color: "#334155", fontSize: 12, width, overflow: "truncate", interval: 0 },
});

// ---- sp_GeneticsDashboard rows → chart rows ----
// Every row and value exactly as the SP returns it: no filtering, no fallbacks,
// no rewriting. `value` is the bar length (number); `raw` is the SP row, used for
// every label / tooltip so values show as the SP returns them.
// RS2 · AM, Area, SalesValue, PrevSales, GrowthPct
const normalizeBizArea = (r) => ({
  key: r.AM,
  name: r.Area,
  value: num(r.SalesValue),
  raw: r,
});
// RS3 · MO, MOName, AM, AMName, DealerCount, Sales, ActiveLA, CollectionPct
const normalizeBizMo = (r) => ({
  key: r.MO,
  name: r.MOName,
  value: num(r.Sales),
  rate: spNum(r.CollectionPct),
  raw: r,
});
// RS4 · DealerCode, DealerName, DealerNameCode, MOName, AMName, Sales,
//       Inventory, ActiveLA, OutstandingDue, LastUpdate
const normalizeBizDealer = (r) => ({
  key: r.DealerCode,
  name: r.DealerName,
  label: r.DealerNameCode,
  value: num(r.Sales),
  raw: r,
});
// GrowthPct NULL (SP: PrevSales = 0) is shown as "-"
const areaGrowthText = (a) => growthText(a.raw.GrowthPct);

// Horizontal bars, one color per area, growth chip at the bar end
const areaOption = memoBy(() => [bizArea.value], () => {
  const list = bizArea.value;
  return {
    // No fixed right margin: growth is its own axis column, and the x-axis
    // leaves just enough headroom for the value label after the longest bar.
    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(37,99,235,0.06)" } },
      formatter: (p) => {
        const a = list[p[0].dataIndex];
        return (
          `<b>${a.name}</b> <span style="color:#cbd5e1">(AM ${a.key})</span>` +
          tipRow("Sales", `৳ ${spText(a.raw.SalesValue)}`) +
          tipRow("Previous", `৳ ${spText(a.raw.PrevSales)}`) +
          tipRow("Growth", spPct(a.raw.GrowthPct))
        );
      },
    },
    xAxis: { type: "value", show: false, max: (v) => v.max * 1.3 },
    yAxis: [
      nameAxis(
        list.map((a) => a.name),
        96
      ),
      // Right-hand growth column, aligned row by row
      {
        type: "category",
        inverse: true,
        position: "right",
        data: list.map((_, i) => String(i)),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          interval: 0,
          margin: 10,
          // Fixed width so every growth value lines up in one column
          // Wide enough for 4-digit growth (SP returns e.g. 9875.9%)
          width: 76,
          formatter: (v) => (list[Number(v)] ? areaGrowthText(list[Number(v)]) : ""),
          rich: {
            up: { color: "#16a34a", fontWeight: 700, fontSize: 11 },
            down: { color: "#b45309", fontWeight: 700, fontSize: 11 },
            na: { color: "#64748b", fontSize: 11 },
          },
        },
      },
    ],
    series: [
      {
        type: "bar",
        barMaxWidth: 14,
        showBackground: true,
        backgroundStyle: { color: "#eef2f7", borderRadius: 8 },
        itemStyle: { borderRadius: [0, 8, 8, 0] },
        data: list.map((a, i) => ({
          value: a.value,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: BIZ_COLORS[i % BIZ_COLORS.length] + "99" },
                { offset: 1, color: BIZ_COLORS[i % BIZ_COLORS.length] },
              ],
            },
          },
        })),
        label: {
          show: true,
          position: "right",
          distance: 8,
          formatter: (p) => `{v|${spText(list[p.dataIndex].raw.SalesValue)}}`,
          rich: {
            v: { color: "#0f172a", fontWeight: 700, fontSize: 12 },
          },
        },
      },
    ],
  };
});

// Columns = sales, line = collection % on its own 0–100 axis
const moOption = memoBy(() => [bizMo.value], () => {
  const list = bizMo.value;
  return {
    grid: { left: 4, right: 4, top: 22, bottom: 0, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: "axis",
      formatter: (p) => {
        const m = list[p[0].dataIndex];
        return (
          `<b>${m.name}</b> <span style="color:#cbd5e1">(${m.key})</span>` +
          tipRow("Area", spText(m.raw.AMName)) +
          tipRow("Sales", `৳ ${spText(m.raw.Sales)}`) +
          tipRow("Collection", spPct(m.raw.CollectionPct)) +
          tipRow("Dealers", spText(m.raw.DealerCount)) +
          tipRow("Active LAs", spText(m.raw.ActiveLA))
        );
      },
    },
    xAxis: {
      type: "category",
      data: list.map((m) => m.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: {
        color: "#475569",
        fontSize: 11,
        interval: 0,
        width: 70,
        overflow: "truncate",
        rotate: list.length > 5 ? 30 : 0,
      },
    },
    yAxis: [
      {
        type: "value",
        // Axis scale ticks, plain (no K / L / Cr, no separators)
        axisLabel: { color: "#94a3b8", fontSize: 10, formatter: (v) => String(v) },
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      },
      {
        type: "value",
        min: 0,
        // The SP can return collection above 100% (payments on older dues)
        max: (v) => Math.max(100, Math.ceil(v.max / 10) * 10),
        axisLabel: { color: "#94a3b8", fontSize: 10, formatter: "{value}%" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        barMaxWidth: 26,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#7c3aed" },
              { offset: 1, color: "#c4b5fd" },
            ],
          },
        },
        label: {
          show: list.length <= 6,
          position: "top",
          color: "#334155",
          fontSize: 10,
          fontWeight: 600,
          formatter: (p) => spText(list[p.dataIndex].raw.Sales),
        },
        data: list.map((m) => m.value),
      },
      {
        name: "Collection %",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        // Orange contrasts with the purple bars; labels sit on a white pill
        // so they stay readable where they overlap a bar
        lineStyle: { width: 2.5, color: "#f97316" },
        itemStyle: { color: "#fff", borderColor: "#f97316", borderWidth: 2.5 },
        z: 10,
        label: {
          show: true,
          position: "top",
          distance: 8,
          color: "#c2410c",
          fontSize: 10,
          fontWeight: 700,
          backgroundColor: "#fff",
          borderColor: "#fed7aa",
          borderWidth: 1,
          borderRadius: 4,
          padding: [2, 5],
          formatter: (p) =>
            p.value == null ? "" : spPct(list[p.dataIndex].raw.CollectionPct),
        },
        data: list.map((m) => m.rate),
      },
    ],
  };
});

// Sales bar per dealer; the SP has no collected amount per dealer, so no split.
// The SP returns every dealer (thousands). Like Area-wise, the chart is drawn
// at full height and the .biz-scroll box scrolls it with the native scrollbar.
// It renders as SVG (see template): a canvas that tall exceeds browser limits.
const dealerOption = memoBy(() => [bizDealer.value], () => {
  const list = bizDealer.value;
  return {
    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(5,150,105,0.06)" } },
      formatter: (p) => {
        const d = list[p[0].dataIndex];
        return (
          `<b>${d.name}</b> <span style="color:#cbd5e1">(${d.key})</span>` +
          tipRow("MO", spText(d.raw.MOName)) +
          tipRow("Area", spText(d.raw.AMName)) +
          tipRow("Sales", `৳ ${spText(d.raw.Sales)}`) +
          tipRow("Outstanding due", `৳ ${spText(d.raw.OutstandingDue)}`) +
          tipRow("Inventory", spText(d.raw.Inventory)) +
          tipRow("Active LAs", spText(d.raw.ActiveLA)) +
          tipRow("Last update", spDate(d.raw.LastUpdate))
        );
      },
    },
    // Headroom for the value label after the longest bar, instead of a fixed margin
    xAxis: { type: "value", show: false, max: (v) => v.max * 1.22 },
    yAxis: nameAxis(
      list.map((d) => d.label),
      130
    ),
    series: [
      {
        name: "Sales",
        type: "bar",
        barMaxWidth: 14,
        showBackground: true,
        backgroundStyle: { color: "#eef2f7", borderRadius: 8 },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#6ee7b7" },
              { offset: 1, color: "#10b981" },
            ],
          },
        },
        label: {
          show: true,
          position: "right",
          distance: 6,
          color: "#0f172a",
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => spText(list[p.dataIndex].raw.Sales),
        },
        data: list.map((d) => d.value),
      },
    ],
  };
});

// Clicking a bar narrows the whole dashboard to it.
const filterBy = (key, value) => {
  if (!value || value === "unmapped" || value === "other") return;
  filters[key] = value;
  onFilterChange(key);
  applyFilters();
};

// =====================================================================
// LA engagement · Product & portfolio
// =====================================================================
const productKeyOf = (r) => r.productCode || r.product;
const portfolioKeyOfSale = (r) => portfolioOf(r.productCode) || "other";
const portfolioName = (id) => portfolios.value.find((p) => p.id === id)?.name ?? "Other";
const PORTFOLIO_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#eab308",
  "#8b5cf6",
  "#14b8a6",
  "#84cc16",
  "#64748b",
];

// g = the SP's GrowthPct, shown exactly as returned (NULL → "-")
const growthLabel = (g) =>
  g === null || g === undefined ? "-" : `${num(g) >= 0 ? "▲" : "▼"} ${g}%`;
const growthCls = (g) =>
  g === null || g === undefined ? "is-new" : num(g) >= 0 ? "is-up" : "is-down";

// LA ids per segment (plain Sets; counts are mirrored in agg.segments)
let segmentIds = {};
const SEGMENTS = [
  {
    id: "high",
    label: "High Value",
    hint: "Top 20% of buying LAs by sales",
    icon: CrownOutlined,
    c: "#16a34a",
  },
  {
    id: "repeat",
    label: "Repeat LA",
    hint: "Bought on 2 or more days",
    icon: RetweetOutlined,
    c: "#2563eb",
  },
  {
    id: "onetime",
    label: "One-Time LA",
    hint: "Bought on a single day",
    icon: UserOutlined,
    c: "#ca8a04",
  },
  {
    id: "nobuy",
    label: "No Purchase",
    hint: "Active LAs with no purchase in this period",
    icon: FieldTimeOutlined,
    c: "#475569",
  },
  {
    id: "priority",
    label: "Collection Priority",
    hint: "Have due and under 50% collected",
    icon: AlertOutlined,
    c: "#7c3aed",
  },
];

const mixOf = (n) => (n >= 3 ? "High" : n === 2 ? "Medium" : "Low");

// Per-LA stats for the period: sales, active days, product mix, collection
const laStatsOf = (rows) => {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.laid))
      map.set(r.laid, {
        key: r.laid,
        name: r.laName,
        value: 0,
        payment: 0,
        due: 0,
        qty: 0,
        lines: 0,
        dayset: new Set(),
        productset: new Set(),
        lastBuy: 0,
      });
    const s = map.get(r.laid);
    s.value += r.value;
    s.payment += r.payment;
    s.due += r.due;
    s.qty += r.qty;
    s.lines += 1;
    if (r.date && !Number.isNaN(r.date.getTime())) {
      s.dayset.add(ymd(r.date));
      s.lastBuy = Math.max(s.lastBuy, r.date.getTime());
    }
    s.productset.add(productKeyOf(r));
  }
  return [...map.values()].map(({ dayset, productset, ...s }) => {
    const la = laById.get(s.key);
    return {
      ...s,
      name: la?.name ?? s.name,
      upazilla: la ? `${la.upazilla}, ${la.district}` : "",
      days: dayset.size || 1,
      products: productset.size,
      mix: mixOf(productset.size),
      rate: s.value ? (s.payment / s.value) * 100 : 0,
    };
  });
};

// Product status from share of sales, growth and collection
const productStatus = (share, growth, rate) => {
  if (rate < 70) return { id: "watch", label: "Collection Watch" };
  if (share >= 15 && (growth === null || growth >= 0))
    return { id: "core", label: "Core Growth Engine" };
  if (growth === null || growth >= 20)
    return { id: "emerging", label: "Emerging Growth" };
  if (growth < -10) return { id: "declining", label: "Declining" };
  return { id: "maintain", label: "Maintain / Monitor" };
};

const withGrowth = (list, prevMap, total) =>
  list.map((g) => {
    const prev = prevMap.get(g.key)?.value ?? 0;
    return {
      ...g,
      prev,
      growth: prev ? change(g.value, prev) : null,
      share: total ? (g.value / total) * 100 : 0,
    };
  });

const buildEngagement = (rows) => {
  // ---- LAs & segments ----
  const stats = laStatsOf(rows).sort((a, b) => b.value - a.value);
  agg.laStats = stats;
  const n = stats.length;
  const highN = n ? Math.max(1, Math.ceil(n * 0.2)) : 0;
  const buyers = new Set(stats.map((s) => s.key));
  const activeLas = scopeLas.value.filter((l) => l.active);
  segmentIds = {
    high: new Set(stats.slice(0, highN).map((s) => s.key)),
    repeat: new Set(stats.filter((s) => s.days >= 2).map((s) => s.key)),
    onetime: new Set(stats.filter((s) => s.days < 2).map((s) => s.key)),
    nobuy: new Set(activeLas.filter((l) => !buyers.has(str(l.id))).map((l) => str(l.id))),
    priority: new Set(stats.filter((s) => s.due > 0 && s.rate < 50).map((s) => s.key)),
  };
  agg.segments = SEGMENTS.map((s) => {
    const count = segmentIds[s.id].size;
    const base = s.id === "nobuy" ? activeLas.length : n;
    return {
      ...s,
      count,
      share: base ? (count / base) * 100 : 0,
      baseLabel: s.id === "nobuy" ? "of active LAs" : "of buying LAs",
    };
  });

  // ---- Products ----
  const total = agg.totals.value;
  const productKey = (r) => [productKeyOf(r), r.product];
  agg.productPerf = withGrowth(
    groupRowsOf(rows, productKey),
    rollup(prevSales.value, productKey),
    total
  ).map((p) => ({
    ...p,
    portfolio: portfolioName(portfolioOf(p.key)),
    status: productStatus(p.share, p.prev ? change(p.value, p.prev) : null, p.rate),
  }));

  // ---- Portfolios ----
  const pfKey = (r) => {
    const k = portfolioKeyOfSale(r);
    return [k, portfolioName(k)];
  };
  const productsPerPf = new Map();
  for (const r of rows) {
    const k = portfolioKeyOfSale(r);
    if (!productsPerPf.has(k)) productsPerPf.set(k, new Set());
    productsPerPf.get(k).add(productKeyOf(r));
  }
  agg.portfolioPerf = withGrowth(
    groupRowsOf(rows, pfKey),
    rollup(prevSales.value, pfKey),
    total
  ).map((p, i) => ({
    ...p,
    products: productsPerPf.get(p.key)?.size ?? 0,
    color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
  }));
};


// =====================================================================
// Inventory & stock risk · Dealer payment & due aging
// =====================================================================
// A dealer at or below this many units (but above 0) is "low stock".
const LOW_STOCK_LEVEL = 20;
// No stock entry for this many days → "stock not updated".
const STALE_DAYS = 30;

const ageDays = (ms) => Math.max(0, Math.floor((Date.now() - ms) / DAY));
const daysAgoLabel = (ms) => {
  if (!ms) return "never";
  const d = ageDays(ms);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

const AGING = [
  { id: "a7", label: "0-7 Days", max: 7, c: "#22c55e" },
  { id: "a15", label: "8-15 Days", max: 15, c: "#eab308" },
  { id: "a30", label: "16-30 Days", max: 30, c: "#d97706" },
  { id: "a31", label: "30+ Days", max: Infinity, c: "#92400e" },
];
// Age of a purchase line's due = days since the purchase
const agingBucketOf = (r) => {
  const t = r.date?.getTime();
  const d = Number.isFinite(t) ? ageDays(t) : Infinity;
  return AGING.find((b) => d <= b.max).id;
};
const dueStatus = (age) =>
  age === null || age > 30
    ? { id: "critical", label: "Critical" }
    : age > 15
    ? { id: "attention", label: "Watch" }
    : { id: "normal", label: "Normal" };

const stockStatusOf = (row) =>
  row.stock === null
    ? "No entry"
    : row.stock === 0
    ? "Zero"
    : row.stock <= LOW_STOCK_LEVEL
    ? "Low"
    : row.age > STALE_DAYS
    ? "Not updated"
    : "OK";

const buildRisk = (rows) => {
  // ---- Stock: latest entry per active, in-scope dealer ----
  const latest = new Map();
  for (const e of stockEntries) if (!stockCodes || stockCodes.has(e.code)) latest.set(e.code, e);
  const stockRows = scopeDealers.value
    .filter((d) => d.active)
    .map((d) => {
      const e = latest.get(d.code);
      const row = {
        key: d.code,
        name: d.name,
        code: d.code,
        stock: e ? e.items : null,
        lastUpdate: e?.at || null,
        age: e?.at ? ageDays(e.at) : null,
      };
      return { ...row, status: stockStatusOf(row) };
    })
    .sort((a, b) => (a.stock ?? -1) - (b.stock ?? -1));
  agg.stockRows = stockRows;
  const low = stockRows.filter((r) => r.stock !== null && r.stock > 0 && r.stock <= LOW_STOCK_LEVEL);
  let lastUpdate = 0;
  for (const e of latest.values()) lastUpdate = Math.max(lastUpdate, e.at || 0);
  agg.stockRisk = {
    low: low.length,
    lowUnits: sumOf(low, "stock"),
    zero: stockRows.filter((r) => r.stock === 0).length,
    stale: stockRows.filter((r) => r.lastUpdate === null || r.age > STALE_DAYS).length,
    lastUpdate: lastUpdate || null,
    prevTotal: stockSeries([periodRange().from.getTime() - 1])[0].total,
  };

  // ---- Due aging ----
  const dueRows = rows.filter((r) => r.due > 0);
  const totalDue = sumOf(dueRows, "due");
  agg.aging = AGING.map((b) => {
    const value = sumOf(
      dueRows.filter((r) => agingBucketOf(r) === b.id),
      "due"
    );
    return { ...b, value, share: totalDue ? (value / totalDue) * 100 : 0 };
  });

  // ---- Top due dealers ----
  const districtOfDealer = new Map();
  for (const l of scopeLas.value)
    if (!districtOfDealer.has(l.dealerCode)) districtOfDealer.set(l.dealerCode, l.district);
  const byDealer = new Map();
  for (const r of rows) {
    const code = dealerCodeOfSale(r);
    if (!code) continue;
    if (!byDealer.has(code)) byDealer.set(code, { due: 0, oldest: Infinity, lastPay: 0 });
    const g = byDealer.get(code);
    const t = r.date?.getTime();
    if (r.due > 0) {
      g.due += r.due;
      if (Number.isFinite(t)) g.oldest = Math.min(g.oldest, t);
    }
    if (r.payment > 0 && Number.isFinite(t)) g.lastPay = Math.max(g.lastPay, t);
  }
  agg.dueDealers = [...byDealer]
    .filter(([, g]) => g.due > 0)
    .map(([code, g]) => {
      const a = areaByDealer.get(code);
      const age = g.oldest === Infinity ? null : ageDays(g.oldest);
      return {
        key: code,
        name: dealerByCode.get(code)?.name ?? code,
        area: (areaReady() ? a?.areaLabel : districtOfDealer.get(code)) || "-",
        mo: a?.moLabel || "-",
        due: g.due,
        lastPay: g.lastPay || null,
        age,
        status: dueStatus(age),
      };
    })
    .sort((a, b) => b.due - a.due);
};

// ---------------- Inventory & Stock Risk (SP inventory, RS5 · 1 row) ----------------
// Thresholds are the SP's own defaults: low stock = 1–@LowStockQty (10) units per
// product line, stale = no stock update in @StaleDays (7) days.
const spDaysAgo = (d) => (d === null || d === undefined ? "-" : `${d} days ago`);

const riskTiles = () => {
  const r = inventory.value;
  return [
    {
      key: "current",
      label: "Current Stock",
      value: spText(r.CurrentStock),
      unit: "Units",
      sub: "Total in hand",
      icon: InboxOutlined,
      c: "#4f46e5",
      hint: "Total stock in hand",
    },
    {
      key: "low",
      label: "Low Stock",
      value: spText(r.LowStockUnits),
      unit: "Units",
      sub: `across ${spText(r.LowStockItems)} product lines`,
      icon: AlertOutlined,
      c: "#ca8a04",
      hint: "Product lines holding 1–10 units",
    },
    {
      key: "zero",
      label: "Zero Stock",
      value: spText(r.ZeroStockItems),
      unit: "Items",
      sub: "product lines at 0 units",
      icon: ExclamationCircleOutlined,
      c: "#b45309",
      hint: "Product lines with no stock left",
    },
    {
      key: "updated",
      label: "Last Stock Update",
      value: spDate(r.LastStockUpdate),
      sub: spDaysAgo(r.LastStockUpdate_DaysAgo),
      icon: CalendarOutlined,
      c: "#0284c7",
      hint: "Most recent stock update",
    },
  ];
};

const riskChips = () => {
  const r = inventory.value;
  return [
    { id: "low", label: "Low Stock", count: spText(r.LowStockDealers), icon: WarningOutlined, c: "#ca8a04", hint: "Dealers with a product line at 1–10 units" },
    { id: "zero", label: "Zero Stock", count: spText(r.ZeroStockDealers), icon: StopOutlined, c: "#b45309", hint: "Dealers with a product line at 0" },
    { id: "stale", label: "Stock Not Updated", count: spText(r.StockNotUpdatedDealers), icon: FieldTimeOutlined, c: "#64748b", hint: "No stock update in the last 7 days, or never" },
  ];
};

const stockRowsFor = (key) => {
  const rows = agg.stockRows;
  if (key === "low") return rows.filter((r) => r.stock !== null && r.stock > 0 && r.stock <= LOW_STOCK_LEVEL);
  if (key === "zero") return rows.filter((r) => r.stock === 0);
  if (key === "stale") return rows.filter((r) => r.lastUpdate === null || r.age > STALE_DAYS);
  return rows;
};

// Trend text; for due, going up is bad
// ---------------- Dealer Payment cards (SP payment, RS6 · 1 row) ----------------
// The SP gives the change itself (NULL when there is no previous-period value).
const spDelta = (d, goodWhenUp = true, unit = "%") => {
  if (d === null || d === undefined) return { delta: "-", deltaCls: "is-flat" };
  const v = num(d);
  return {
    // The SP's value as returned (sign included), only an arrow in front
    delta: `${v >= 0 ? "▲" : "▼"} ${d}${unit}`,
    deltaCls: v >= 0 === goodWhenUp ? "is-good" : "is-bad",
  };
};

const payTiles = () => {
  const r = payment.value ?? {};
  return [
    { key: "purchase", label: "Total Purchase", value: `৳ ${spText(r.TotalPurchase)}`, icon: ShoppingCartOutlined, c: "#2563eb", ...spDelta(r.TotalPurchase_GrowthPct) },
    { key: "paid", label: "Payment Received", value: `৳ ${spText(r.PaymentReceived)}`, icon: WalletOutlined, c: "#16a34a", ...spDelta(r.PaymentReceived_GrowthPct) },
    { key: "due", label: "Outstanding Due", value: `৳ ${spText(r.OutstandingDue)}`, icon: ExclamationCircleOutlined, c: "#b45309", ...spDelta(r.OutstandingDue_GrowthPct, false) },
    { key: "rate", label: "Collection %", value: spPct(r.CollectionPct), icon: PercentageOutlined, c: "#0d9488", ...spDelta(r.CollectionPct_ChangePts, true, " pts") },
  ];
};

// ---------------- Due Aging (SP dueAging, RS7 · 4 rows) ----------------
// Bucket, amount and % come from the SP; colours follow the bucket order.
const AGING_COLORS = ["#22c55e", "#eab308", "#d97706", "#92400e"];
const agingBars = () =>
  [...dueAging.value]
    .sort((a, b) => num(a.SortOrder) - num(b.SortOrder))
    .map((r, i) => ({
      label: r.Bucket,
      value: num(r.DueAmount), // bar height only
      amount: r.DueAmount, // shown as returned
      share: r.DuePct,
      c: AGING_COLORS[i % AGING_COLORS.length],
    }));
const hasAgingDue = () => dueAging.value.some((r) => num(r.DueAmount) > 0);
const agingOption = memoBy(() => [dueAging.value], () => {
  const bars = agingBars();
  return {
    grid: { left: 4, right: 4, top: 44, bottom: 4, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: "item",
      formatter: (p) => {
        const b = bars[p.dataIndex];
        return `<b>${b.label}</b>` + tipRow("Due", `৳ ${spText(b.amount)}`) + tipRow("Share", spPct(b.share));
      },
    },
    xAxis: {
      type: "category",
      data: bars.map((b) => b.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      // Show every bucket name; wrap to a second line instead of hiding one
      axisLabel: {
        color: "#334155",
        fontSize: 11,
        fontWeight: 600,
        interval: 0,
        hideOverlap: false,
        width: 56,
        overflow: "break",
        lineHeight: 14,
      },
    },
    yAxis: { type: "value", show: false },
    // Bars grow up smoothly in a gentle left-to-right wave (no bounce);
    // on data refresh they glide to the new height.
    animation: true,
    animationDuration: 1400,
    animationEasing: "quarticOut",
    animationDelay: (idx) => idx * 120,
    animationDurationUpdate: 900,
    animationEasingUpdate: "quarticInOut",
    series: [
      {
        type: "bar",
        barWidth: "52%",
        // Faint track behind each bar
        showBackground: true,
        backgroundStyle: { color: "rgba(148, 163, 184, 0.08)", borderRadius: [8, 8, 0, 0] },
        // No hover effect at all: bars keep their exact colour (tooltip still shows)
        emphasis: { disabled: true },
        data: bars.map((b) => ({
          value: b.value,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: b.c },
                { offset: 1, color: b.c + "99" },
              ],
            },
          },
        })),
        label: {
          show: true,
          position: "top",
          // Amount and % exactly as the SP returns them
          formatter: (p) =>
            `{v|${spText(bars[p.dataIndex].amount)}}\n{s|(${spPct(bars[p.dataIndex].share)})}`,
          rich: {
            v: { color: "#0f172a", fontSize: 12, fontWeight: 700, lineHeight: 16 },
            s: { color: "#64748b", fontSize: 10, lineHeight: 14 },
          },
        },
      },
    ],
  };
});

const STOCK_COLS = [
  { key: "name", title: "Dealer", type: "text" },
  { key: "code", title: "Code", type: "text" },
  { key: "stock", title: "Stock (Units)", type: "num" },
  { key: "lastUpdate", title: "Last Update", type: "date" },
  { key: "age", title: "Days Since Update", type: "num", noTotal: true },
  { key: "status", title: "Status", type: "text" },
];

// ---------------- Detail modal ----------------
// A stack, so a dealer opened from an area / MO table can go Back.
const detail = reactive({ stack: [], tab: "", search: "" });
const detailTop = () => detail.stack[detail.stack.length - 1];
const DEFAULT_TAB = {
  area: "dealers",
  mo: "dealers",
  dealer: "las",
  la: "products",
  product: "las",
  portfolio: "products",
  segment: "las",
  stock: "dealers",
  aging: "dealers",
};
const detailMeta = (kind) =>
  ({
    area: {
      tone: "blue",
      icon: ClusterOutlined,
      label: areaReady() ? "Area" : "District",
    },
    mo: { tone: "violet", icon: UserOutlined, label: "MO" },
    dealer: { tone: "emerald", icon: ShopOutlined, label: "Dealer" },
    la: { tone: "sky", icon: UserOutlined, label: "LA" },
    product: { tone: "teal", icon: ExperimentOutlined, label: "Product" },
    portfolio: { tone: "indigo", icon: AppstoreOutlined, label: "Portfolio" },
    segment: { tone: "violet", icon: TeamOutlined, label: "LA Segment" },
    stock: { tone: "indigo", icon: InboxOutlined, label: "Stock" },
    aging: { tone: "yellow", icon: FieldTimeOutlined, label: "Due Aging" },
  }[kind]);

const openDetail = (kind, key, name) => {
  if (!key) return;
  detail.stack.push({ kind, key, name });
  detail.tab = DEFAULT_TAB[kind];
  detail.search = "";
};
const closeDetail = () => {
  detail.stack = [];
};
const detailBack = () => {
  detail.stack.pop();
  const top = detailTop();
  if (top) detail.tab = DEFAULT_TAB[top.kind];
  detail.search = "";
};
const selectDetailTab = (id) => {
  detail.tab = id;
  detail.search = "";
};
// Page id for a detail-modal tab: unique per opened entity + tab
const dtPageId = (tab) => `dt-${detailTop()?.kind}-${detailTop()?.key}-${tab?.id}`;
const activeTabId = (tabs) =>
  tabs.some((t) => t.id === detail.tab) ? detail.tab : tabs[0]?.id;

const canFilter = (top) =>
  ({
    dealer: true,
    la: true,
    area: areaReady(),
    mo: areaReady(),
    product: productByCode.has(top.key),
    portfolio: top.key !== "other",
    segment: false,
    stock: false,
    aging: false,
  }[top.kind]);
const filterFromDetail = () => {
  const top = detailTop();
  closeDetail();
  filterBy(top.kind, top.key);
};

// Sales lines that belong to the opened item
const detailSales = (top) => {
  const k = top.key;
  const test = {
    dealer: (r) => dealerCodeOfSale(r) === k,
    mo: (r) => moOfSale(r)[0] === k,
    area: (r) => areaOfSale(r)[0] === k,
    la: (r) => r.laid === k,
    product: (r) => productKeyOf(r) === k,
    portfolio: (r) => portfolioKeyOfSale(r) === k,
    segment: (r) => !!segmentIds[k]?.has(r.laid),
    aging: (r) => r.due > 0 && agingBucketOf(r) === k,
    stock: () => false,
  }[top.kind];
  return sales.value.filter(test);
};

const groupRowsOf = (rows, keyFn) =>
  [...rollup(rows, keyFn).values()]
    .map(({ buyers, ...g }) => ({
      ...g,
      buyingLas: buyers.size,
      rate: g.value ? (g.payment / g.value) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

const dealerRowsOf = (rows) => {
  const perf = new Map(agg.dealerPerf.map((d) => [d.key, d]));
  return groupRowsOf(rows, (r) => {
    const code = dealerCodeOfSale(r) || "unassigned";
    return [code, dealerByCode.get(code)?.name ?? laById.get(r.laid)?.dealerName ?? code];
  }).map((g) => ({
    ...g,
    code: g.key,
    activeLas: perf.get(g.key)?.activeLas ?? 0,
    inventory: perf.get(g.key)?.inventory ?? null,
  }));
};

const laRowsOf = (rows) => {
  const lastBuy = new Map();
  const days = new Map();
  for (const r of rows) {
    const t = r.date?.getTime() || 0;
    if (t > (lastBuy.get(r.laid) ?? 0)) lastBuy.set(r.laid, t);
    if (t) {
      if (!days.has(r.laid)) days.set(r.laid, new Set());
      days.get(r.laid).add(ymd(r.date));
    }
  }
  return groupRowsOf(rows, (r) => [r.laid, laById.get(r.laid)?.name ?? r.laName]).map(
    (g) => {
      const la = laById.get(g.key);
      return {
        ...g,
        mobile: la?.mobile ?? "",
        upazilla: la?.upazilla ?? "",
        status: la ? (la.active ? "Active" : "Inactive") : "-",
        days: days.get(g.key)?.size ?? 0,
        lastBuy: lastBuy.get(g.key) || null,
      };
    }
  );
};

// Column types: text | num | money | pct | date
const SALES_COLS = [
  { key: "qty", title: "Straws", type: "num" },
  { key: "value", title: "Sales (Tk)", type: "money" },
  { key: "payment", title: "Collected", type: "money" },
  { key: "due", title: "Due", type: "money" },
  { key: "rate", title: "Coll. %", type: "pct" },
];
const DEALER_COLS = [
  { key: "name", title: "Dealer", type: "text" },
  { key: "code", title: "Code", type: "text" },
  ...SALES_COLS,
  { key: "buyingLas", title: "Buying LAs", type: "num" },
  { key: "activeLas", title: "Active LAs", type: "num" },
  { key: "inventory", title: "Inventory", type: "num" },
];
const LA_COLS = [
  { key: "name", title: "LA", type: "text" },
  { key: "mobile", title: "Mobile", type: "text" },
  { key: "upazilla", title: "Upazilla", type: "text" },
  { key: "status", title: "Status", type: "text" },
  { key: "days", title: "Active Days", type: "num", noTotal: true },
  ...SALES_COLS,
  { key: "lastBuy", title: "Last Purchase", type: "date" },
];
const groupCols = (title) => [
  { key: "name", title, type: "text" },
  ...SALES_COLS,
  { key: "buyingLas", title: "Buying LAs", type: "num" },
];

const PURCHASE_COLS = [
  { key: "date", title: "Date", type: "date" },
  { key: "name", title: "Product", type: "text" },
  { key: "qty", title: "Straws", type: "num" },
  { key: "bonus", title: "Bonus", type: "num" },
  { key: "value", title: "Sales (Tk)", type: "money" },
  { key: "payment", title: "Collected", type: "money" },
  { key: "due", title: "Due", type: "money" },
];
const purchasesTab = (rows) => ({
  id: "purchases",
  label: "Purchases",
  columns: PURCHASE_COLS,
  rows: [...rows]
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .map((r, i) => ({
      key: i,
      date: r.date?.getTime() || null,
      name: r.product,
      qty: r.qty,
      bonus: r.bonus,
      value: r.value,
      payment: r.payment,
      due: r.due,
    })),
});
// Active LAs that did not buy (they have no sales lines to group)
const noBuyRows = () =>
  scopeLas.value
    .filter((l) => segmentIds.nobuy?.has(str(l.id)))
    .map((l) => ({
      key: str(l.id),
      name: l.name,
      mobile: l.mobile,
      upazilla: l.upazilla,
      status: "Active",
      days: 0,
      qty: 0,
      value: 0,
      payment: 0,
      due: 0,
      rate: 0,
      lastBuy: null,
    }));

const detailTabs = (top) => {
  const rows = detailSales(top);
  const k = top.kind;
  const products = () => ({
    id: "products",
    label: "Products",
    columns: groupCols("Product"),
    rows: groupRowsOf(rows, (r) => [productKeyOf(r), r.product]),
    drill: "product",
  });
  const dealers = () => ({
    id: "dealers",
    label: "Dealers",
    columns: DEALER_COLS,
    rows: dealerRowsOf(rows),
    drill: "dealer",
  });
  const lasTab = () => ({
    id: "las",
    label: "LAs",
    columns: LA_COLS,
    rows: laRowsOf(rows),
    drill: "la",
  });
  const mos = () => ({
    id: "mos",
    label: "MOs",
    columns: groupCols("MO"),
    rows: groupRowsOf(rows, moOfSale),
    drill: "mo",
  });

  if (k === "area") return [dealers(), ...(areaReady() ? [mos()] : []), products()];
  if (k === "mo") return [dealers(), products()];
  if (k === "dealer") return [lasTab(), products()];
  if (k === "la") return [products(), purchasesTab(rows)];
  if (k === "product") return [lasTab(), dealers()];
  if (k === "portfolio") return [products(), dealers(), lasTab()];
  if (k === "aging") return [dealers(), lasTab()];
  if (k === "stock")
    return [
      { id: "dealers", label: "Dealers", columns: STOCK_COLS, rows: stockRowsFor(top.key), drill: "dealer" },
    ];
  // segment
  return [top.key === "nobuy" ? { ...lasTab(), rows: noBuyRows() } : lasTab()];
};

const tabRows = (tab) => {
  const q = detail.search.trim().toLowerCase();
  if (!q) return tab.rows;
  return tab.rows.filter((r) =>
    [r.name, r.key, r.code, r.mobile, r.upazilla].some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(q)
    )
  );
};

const cellText = (col, row) => {
  const v = row[col.key];
  switch (col.type) {
    case "money":
      return fmt(Math.round(v));
    case "num":
      return v === null || v === undefined ? "-" : fmt(v);
    case "pct":
      return `${(Number(v) || 0).toFixed(1)}%`;
    case "date":
      return shortDate(v);
    default:
      return v || "-";
  }
};
const totalCell = (col, rows) => {
  if (col.type === "pct") {
    const value = sumOf(rows, "value");
    return `${(value ? (sumOf(rows, "payment") / value) * 100 : 0).toFixed(1)}%`;
  }
  if (col.type === "money") return fmt(Math.round(sumOf(rows, col.key)));
  if (col.type === "num" && col.key !== "buyingLas" && !col.noTotal)
    return fmt(sumOf(rows, col.key));
  return "";
};
const rateLevel = (p) => (p >= 75 ? "is-high" : p >= 45 ? "is-mid" : "is-low");

const detailTiles = (top) => {
  if (top.kind === "stock") {
    const rows = stockRowsFor(top.key);
    const dated = rows.filter((r) => r.lastUpdate);
    const oldest = dated.length ? Math.min(...dated.map((r) => r.lastUpdate)) : null;
    return [
      { label: "Dealers", value: fmt(rows.length) },
      { label: "Stock", value: `${fmt(sumOf(rows, "stock"))} Units` },
      { label: "Never Updated", value: fmt(rows.filter((r) => r.lastUpdate === null).length) },
      { label: "Oldest Update", value: shortDate(oldest), sub: oldest ? daysAgoLabel(oldest) : "" },
    ];
  }
  const t = totalsOf(detailSales(top));
  const tiles = [
    { label: "Sales", value: `৳ ${money(t.value)}`, sub: `${fmt(t.lines)} purchases` },
    {
      label: "Collected",
      value: `৳ ${money(t.payment)}`,
      sub: `${pct(t.payment, t.value)} of sales`,
    },
    {
      label: "Outstanding Due",
      value: `৳ ${money(t.due)}`,
      sub: `${fmt(t.dueLas)} LAs have due`,
    },
    { label: "Straws", value: fmt(t.qty), sub: t.bonus ? `+ ${fmt(t.bonus)} bonus` : "" },
    { label: "Buying LAs", value: fmt(t.buyingLas) },
  ];
  if (top.kind === "area") {
    const a = agg.areas.find((x) => x.key === top.key);
    if (a)
      tiles.splice(1, 0, {
        label: "Growth",
        value:
          a.growth === null
            ? "New"
            : `${a.growth >= 0 ? "+" : "-"}${Math.abs(a.growth).toFixed(1)}%`,
        cls: a.growth === null ? "" : a.growth >= 0 ? "is-up" : "is-down",
        sub: `prev ৳ ${money(a.prev)}`,
      });
  } else if (top.kind === "mo") {
    const m = agg.mos.find((x) => x.key === top.key);
    if (m) {
      tiles.push({ label: "Dealers", value: fmt(m.dealers) });
      tiles.push({ label: "Active LAs", value: fmt(m.activeLas) });
    }
  } else if (top.kind === "dealer") {
    const d = agg.dealerPerf.find((x) => x.key === top.key);
    const dealer = dealerByCode.get(top.key);
    tiles.push({
      label: "Inventory",
      value: d?.inventory === null || !d ? "-" : fmt(d.inventory),
      sub: `updated ${shortDate(d?.lastUpdate)}`,
    });
    tiles.push({ label: "Active LAs", value: fmt(d?.activeLas ?? 0) });
    if (dealer)
      tiles.push({
        label: "Status",
        value: dealer.active ? "Active" : "Inactive",
        cls: dealer.active ? "is-up" : "",
        sub: dealer.registered ? "Uses the app" : "Not on the app",
      });
  }
  if (top.kind === "la") {
    const s = agg.laStats.find((x) => x.key === top.key);
    const la = laById.get(top.key);
    tiles.splice(4, 1); // "Buying LAs" is always 1 here
    tiles.push({
      label: "Active Days",
      value: fmt(s?.days ?? 0),
      sub: `last ${shortDate(s?.lastBuy || null)}`,
    });
    tiles.push({
      label: "Product Mix",
      value: s?.mix ?? "-",
      sub: `${fmt(s?.products ?? 0)} products`,
    });
    if (la)
      tiles.push({
        label: "Dealer",
        value: (dealerByCode.get(la.dealerCode)?.name ?? la.dealerName) || "-",
        sub: `${la.upazilla}, ${la.district}`,
      });
  }
  if (top.kind === "product" || top.kind === "portfolio") {
    const list = top.kind === "product" ? agg.productPerf : agg.portfolioPerf;
    const p = list.find((x) => x.key === top.key);
    if (p)
      tiles.splice(
        1,
        0,
        {
          label: "Growth",
          value: growthLabel(p.growth),
          cls: growthCls(p.growth),
          sub: `prev ৳ ${money(p.prev)}`,
        },
        {
          label: "Share of Sales",
          value: `${p.share.toFixed(1)}%`,
          sub: p.status ? p.status.label : `${fmt(p.products)} products`,
        }
      );
  }
  if (top.kind === "segment") {
    const s = agg.segments.find((x) => x.id === top.key);
    if (s)
      tiles.unshift({
        label: "LAs in Segment",
        value: fmt(s.count),
        sub: `${s.share.toFixed(1)}% ${s.baseLabel}`,
      });
  }
  return tiles;
};

const selectDistrict = (name) => {
  selectedDistrict.value = selectedDistrict.value === name ? null : name;
  agg.trend = buildTrend(
    selectedDistrict.value
      ? sales.value.filter((r) => districtOf(r) === selectedDistrict.value)
      : sales.value
  );
};

const collectionRate = () =>
  agg.totals.value ? (agg.totals.payment / agg.totals.value) * 100 : 0;
const rateOf = (d) => (d.value ? (d.payment / d.value) * 100 : 0);
// Collection-rate band → bar color class (no reds)
const achvLevel = (p) => (p >= 75 ? "lvl-high" : p >= 45 ? "lvl-mid" : "lvl-low");

// =====================================================================
// KPI cards
// =====================================================================
const SUBJECTS = {
  dealers: { label: "Total Dealers", kind: "dealer", test: () => true },
  activeDealers: { label: "Active Dealers", kind: "dealer", test: (d) => d.active },
  inactiveDealers: { label: "Inactive Dealers", kind: "dealer", test: (d) => !d.active },
  registered: { label: "Registered Dealers", kind: "dealer", test: (d) => d.registered },
  notRegistered: {
    label: "Dealers Not Registered",
    kind: "dealer",
    test: (d) => !d.registered,
  },
  appUsers: {
    label: "Active App Users",
    kind: "dealer",
    test: (d) => d.registered && d.active,
  },
  las: { label: "Total LAs", kind: "la", test: () => true },
  activeLas: { label: "Active LAs", kind: "la", test: (l) => l.active },
  inactiveLas: { label: "Inactive LAs", kind: "la", test: (l) => !l.active },
};
const subjectLabel = (key) => SUBJECTS[key]?.label ?? "";

const activeDealerCount = () => scopeDealers.value.filter((d) => d.active).length;
const registeredDealerCount = () => scopeDealers.value.filter((d) => d.registered).length;
const activeLaCount = () => scopeLas.value.filter((l) => l.active).length;
// Dealers who are registered on the app and active
const activeAppUserCount = () =>
  scopeDealers.value.filter((d) => d.registered && d.active).length;

const scrollToSection = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

// ---------------- 7 summary cards (sp_GeneticsDashboard RS1 · kpi, 1 row) ----------------
// Value and change come straight from the SP, shown as returned. NULL → "-".
// Sparkline only where the SP's monthly trend (RS5) has that same column.
const kpiDelta = (d, goodWhenUp = true, unit = "%") => {
  if (d === null || d === undefined) return { delta: "-", deltaCls: "", up: null };
  const up = num(d) >= 0;
  return {
    delta: `${d}${unit}`,
    deltaCls: up === goodWhenUp ? "trend--good" : "trend--bad",
    up,
  };
};
const kpiSpark = (col) =>
  col ? kpiTrend.value.map((r) => num(r[col])) : [];
const KPI_CARDS = [
  { key: "dealers", label: "Total Dealers", field: "TotalDealers", noMeta: true, delta: "TotalDealers_GrowthPct", icon: ShopOutlined, c1: "#3b82f6", c2: "#1d4ed8" },
  { key: "activeDealers", label: "Active Dealers", field: "ActiveDealers", delta: "ActiveDealers_GrowthPct", spark: "ActiveDealers", icon: TeamOutlined, c1: "#8b5cf6", c2: "#6d28d9" },
  { key: "activeLas", label: "Active LAs", field: "ActiveLAs", delta: "ActiveLAs_GrowthPct", spark: "ActiveLAs", icon: EnvironmentOutlined, c1: "#10b981", c2: "#047857" },
  { key: "collection", label: "Collection %", field: "CollectionPct", suffix: "%", delta: "CollectionPct_ChangePts", unit: " pts", spark: "CollectionPct", icon: WalletOutlined, c1: "#84cc16", c2: "#4d7c0f" },
  { key: "due", label: "Outstanding Due", field: "OutstandingDue", prefix: "৳ ", delta: "OutstandingDue_GrowthPct", goodWhenUp: false, icon: ExclamationCircleOutlined, c1: "#eab308", c2: "#a16207" },
  { key: "stock", label: "Current Stock", field: "CurrentStock", suffix: " Units", noMeta: true, delta: "CurrentStock_GrowthPct", icon: InboxOutlined, c1: "#6366f1", c2: "#4338ca" },
  { key: "appUsers", label: "Active App Users", field: "ActiveAppUsers", delta: "ActiveAppUsers_GrowthPct", icon: MobileOutlined, c1: "#14b8a6", c2: "#0f766e" },
];
const statCards = () => {
  const r = kpi.value ?? {};
  return KPI_CARDS.map((c) => {
    const v = r[c.field];
    return {
      ...c,
      loading: loading.main,
      display:
        v === null || v === undefined ? "-" : `${c.prefix ?? ""}${v}${c.suffix ?? ""}`,
      ...kpiDelta(r[c.delta], c.goodWhenUp ?? true, c.unit ?? "%"),
      spark: kpiSpark(c.spark),
    };
  });
};

// Sparkline paths in an 80×30 box
const sparkPoints = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => [
    (i / (values.length - 1)) * 80,
    27 - ((v - min) / span) * 24,
  ]);
};
const sparkLine = (values) =>
  sparkPoints(values)
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
const sparkArea = (values) => `${sparkLine(values)} L80,30 L0,30 Z`;

// =====================================================================
// Sales trend chart
// =====================================================================
const TREND_STOPS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const trendColorAt = (t) => {
  const seg = Math.min(Math.floor(t * (TREND_STOPS.length - 1)), TREND_STOPS.length - 2);
  const local = t * (TREND_STOPS.length - 1) - seg;
  const a = hexToRgb(TREND_STOPS[seg]);
  const b = hexToRgb(TREND_STOPS[seg + 1]);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * local)).join(",")})`;
};
const trendGradient = (alpha = 1) => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: TREND_STOPS.map((c, i) => {
    const [r, g, b] = hexToRgb(c);
    return {
      offset: i / (TREND_STOPS.length - 1),
      color: `rgba(${r},${g},${b},${alpha})`,
    };
  }),
});
const metricFmt = (metric, v) =>
  metric === "qty" ? `${fmt(v)} straws` : `৳ ${money(v)}`;

const trendStats = () => {
  const tr = agg.trend;
  const values = tr[trendMetric.value];
  const total = values.reduce((s, v) => s + v, 0);
  const bestIdx = values.reduce((bi, v, i) => (v > values[bi] ? i : bi), 0);
  const unit = tr.monthly ? "month" : "day";
  const activeBuckets = values.filter((v) => v > 0).length;
  return [
    {
      key: "total",
      label: `Total ${trendMetric.value === "qty" ? "straws" : "value"}`,
      value: metricFmt(trendMetric.value, total),
      tone: "indigo",
      icon: RiseOutlined,
    },
    {
      key: "avg",
      label: `Average per ${unit}`,
      value: metricFmt(trendMetric.value, values.length ? total / values.length : 0),
      tone: "purple",
      icon: BarChartOutlined,
    },
    {
      key: "best",
      label: `Best ${unit}`,
      value: total
        ? `${tr.labels[bestIdx]} · ${
            trendMetric.value === "qty" ? fmt(values[bestIdx]) : money(values[bestIdx])
          }`
        : "-",
      tone: "cyan",
      icon: TrophyOutlined,
    },
    {
      key: "active",
      label: `Selling ${unit}s`,
      value: `${activeBuckets} of ${values.length}`,
      tone: "emerald",
      icon: CalendarOutlined,
    },
  ];
};

const trendOption = () => {
  const tr = agg.trend;
  const metric = trendMetric.value;
  const values = tr[metric];
  const last = Math.max(values.length - 1, 1);
  const short = (v) => (metric === "qty" ? fmt(v) : money(v));
  return {
    grid: { left: 8, right: 24, top: 52, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15,23,42,0.92)",
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: "#fff", fontSize: 12 },
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(99,102,241,0.35)", width: 1.5, type: "dashed" },
      },
      formatter: (p) => {
        const i = p[0].dataIndex;
        const other =
          metric === "qty" ? `৳ ${money(tr.value[i])}` : `${fmt(tr.qty[i])} straws`;
        return `<span style="color:#cbd5e1">${
          tr.tips[i]
        }</span><br/><b style="font-size:14px">${metricFmt(
          metric,
          values[i]
        )}</b><br/><span style="color:#cbd5e1">${other}</span>`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: tr.labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: { color: "#475569", fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", formatter: (v) => short(v) },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: values.length > 40 ? 5 : 8,
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: "#fff",
            borderColor: trendColorAt(i / last),
            borderWidth: 2.5,
          },
        })),
        lineStyle: {
          width: 3.5,
          color: trendGradient(1),
          shadowColor: "rgba(99,102,241,0.35)",
          shadowBlur: 14,
          shadowOffsetY: 8,
        },
        emphasis: { scale: 1.6, itemStyle: { borderWidth: 3 } },
        // Labels size themselves to the text so values always fit
        markPoint: {
          symbol: "circle",
          symbolSize: 1,
          itemStyle: { color: "transparent" },
          label: {
            show: true,
            position: "top",
            distance: 12,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 14,
            padding: [4, 8],
            borderRadius: 6,
            formatter: (p) => `${p.name === "Best" ? "▲" : "▼"} ${short(p.value)}`,
          },
          data: [
            { type: "max", name: "Best", label: { backgroundColor: "#10b981" } },
            { type: "min", name: "Lowest", label: { backgroundColor: "#64748b" } },
          ],
        },
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: { color: "#a5b4fc", type: "dashed", width: 1.2 },
          label: {
            color: "#4f46e5",
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: "#eef2ff",
            padding: [2, 6],
            borderRadius: 4,
            formatter: (p) => `Avg ${short(p.value)}`,
            position: "insideEndTop",
          },
          data: [{ type: "average" }],
        },
        areaStyle: { color: trendGradient(0.16) },
      },
    ],
  };
};

// =====================================================================
// Breed mix donut & product rank
// =====================================================================
// Categorical colors in fixed order (no reds/pinks); "Others" is neutral.
const MIX_COLORS = ["#2563eb", "#14b8a6", "#eab308", "#7c3aed", "#22c55e", "#94a3b8"];
const mixSlices = () => {
  const top = agg.products.slice(0, 5).map((p) => ({ name: p.name, value: p.qty }));
  const rest = agg.products.slice(5).reduce((s, p) => s + p.qty, 0);
  return rest ? [...top, { name: "Others", value: rest }] : top;
};
const mixOption = () => ({
  title: {
    text: fmt(agg.totals.qty),
    subtext: "straws",
    left: "center",
    top: "center",
    itemGap: 2,
    textStyle: { fontSize: 20, fontWeight: 700, color: "#0f172a" },
    subtextStyle: { fontSize: 11, color: "#94a3b8" },
  },
  tooltip: {
    trigger: "item",
    formatter: (p) => `<b>${p.name}</b><br/>${fmt(p.value)} straws (${p.percent}%)`,
  },
  series: [
    {
      type: "pie",
      radius: ["62%", "84%"],
      padAngle: 2,
      itemStyle: { borderRadius: 6 },
      label: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: mixSlices().map((m, i) => ({ ...m, itemStyle: { color: MIX_COLORS[i] } })),
    },
  ],
});

const rankOption = () => {
  const metric = rankMetric.value;
  const list = [...agg.products].sort((a, b) => b[metric] - a[metric]);
  const nameWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 110 : 200;
  return {
    grid: { left: 8, right: 70, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(37,99,235,0.05)" } },
      formatter: (p) => {
        const x = list[p[0].dataIndex];
        return `#${p[0].dataIndex + 1} <b>${x.name}</b><br/>${fmt(
          x.qty
        )} straws · ৳ ${money(x.value)}`;
      },
    },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
        formatter: (v) => (metric === "qty" ? fmt(v) : money(v)),
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: list.map((x) => x.name),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        interval: 0,
        width: nameWidth,
        overflow: "truncate",
        color: "#334155",
        fontSize: 12,
        formatter: (name, i) => `{r|#${i + 1}}  ${name}`,
        rich: { r: { color: "#2563eb", fontWeight: 700 } },
      },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 18,
        showBackground: true,
        backgroundStyle: { color: "#f1f5f9", borderRadius: 9 },
        data: list.map((x) => x[metric]),
        itemStyle: {
          borderRadius: 9,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#7dd3fc" },
              { offset: 1, color: "#2563eb" },
            ],
          },
        },
        label: {
          show: true,
          position: "right",
          color: "#0f172a",
          fontSize: 11,
          fontWeight: 600,
          formatter: (p) => (metric === "qty" ? fmt(p.value) : `৳ ${money(p.value)}`),
        },
      },
    ],
  };
};

// =====================================================================
// Top lists
// =====================================================================
const topLists = () => [
  {
    key: "las",
    title: "Top LAs by Purchase",
    hint: `Straws bought · ${periodLabel()}`,
    tone: "blue",
    icon: TrophyOutlined,
    field: "qty",
    format: (v) => fmt(v),
    rows: agg.topLas,
  },
  {
    key: "dealers",
    title: "Top Dealers by LA Sales",
    hint: `Straws their LAs bought · ${periodLabel()}`,
    tone: "purple",
    icon: ShopOutlined,
    field: "qty",
    format: (v) => fmt(v),
    rows: agg.topDealers,
  },
  {
    key: "due",
    title: "LAs with Highest Due",
    hint: `Outstanding on purchases · ${periodLabel()}`,
    tone: "slate",
    icon: ExclamationCircleOutlined,
    field: "due",
    format: (v) => `৳ ${money(v)}`,
    rows: agg.dueLas,
  },
];

// =====================================================================
// Dealer & LA status donuts
// =====================================================================
const donuts = () => {
  const d = scopeDealers.value.length;
  const l = scopeLas.value.length;
  return [
    {
      key: "dealers",
      title: "Dealers",
      subject: "dealers",
      tone: "purple",
      color: "#9333ea",
      total: d,
      loading: loading.dealers,
      parts: [
        { name: "Active", value: activeDealerCount(), subject: "activeDealers" },
        { name: "Inactive", value: d - activeDealerCount(), subject: "inactiveDealers" },
      ],
    },
    {
      key: "las",
      title: "LAs",
      subject: "las",
      tone: "sky",
      color: "#0284c7",
      total: l,
      loading: loading.las,
      parts: [
        { name: "Active", value: activeLaCount(), subject: "activeLas" },
        { name: "Inactive", value: l - activeLaCount(), subject: "inactiveLas" },
      ],
    },
    {
      key: "app",
      title: "Registered Dealers",
      subject: "dealers",
      tone: "cyan",
      color: "#0891b2",
      total: d,
      loading: loading.dealers,
      parts: [
        { name: "Registered", value: registeredDealerCount(), subject: "registered" },
        {
          name: "Not registered",
          value: d - registeredDealerCount(),
          subject: "notRegistered",
        },
      ],
    },
  ];
};

const donutOption = (donut) => ({
  title: {
    text: fmt(donut.total),
    subtext: "Total",
    left: "center",
    top: "center",
    itemGap: 2,
    textStyle: { fontSize: 22, fontWeight: 700, color: "#0f172a" },
    subtextStyle: { fontSize: 11, color: "#94a3b8" },
  },
  tooltip: {
    trigger: "item",
    formatter: (p) =>
      `${donut.title}<br/><b>${p.name}</b>: ${fmt(p.value)} (${
        p.percent
      }%)<br/><span style="color:#8a8984">Click to break down</span>`,
  },
  series: [
    {
      type: "pie",
      radius: ["66%", "84%"],
      padAngle: 2,
      itemStyle: { borderRadius: 6 },
      label: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: donut.parts.map((p, i) => ({
        name: p.name,
        value: p.value,
        itemStyle: { color: i === 0 ? donut.color : "#e2e8f0" },
      })),
    },
  ],
});

// A slice click opens that slice's subject instead of the whole donut's.
const onSliceClick = (donut, params) => {
  params?.event?.event?.stopPropagation?.();
  const part = donut.parts[params.dataIndex];
  if (part) openPicker(part.subject);
};

// ---------------- Breakdown flow ----------------
const MODES = [
  {
    id: "location",
    label: "Location Wise",
    icon: GlobalOutlined,
    steps: ["District", "Upazilla", "Dealer", "LA"],
  },
  {
    id: "area",
    label: "Sales Area Wise",
    icon: ClusterOutlined,
    steps: ["Area", "MO", "Dealer", "LA"],
  },
];

// Pop-ups take the color and icon of the card that opened them.
const SUBJECT_STYLE = {
  dealers: { tone: "purple", icon: TeamOutlined },
  inactiveDealers: { tone: "purple", icon: TeamOutlined },
  activeDealers: { tone: "green", icon: CheckCircleOutlined },
  registered: { tone: "cyan", icon: MobileOutlined },
  notRegistered: { tone: "cyan", icon: MobileOutlined },
  appUsers: { tone: "cyan", icon: MobileOutlined },
  las: { tone: "sky", icon: ApartmentOutlined },
  inactiveLas: { tone: "sky", icon: ApartmentOutlined },
  activeLas: { tone: "sky", icon: EnvironmentOutlined },
};
const toneOf = (subject) => SUBJECT_STYLE[subject]?.tone ?? "blue";
const iconOf = (subject) => SUBJECT_STYLE[subject]?.icon ?? TeamOutlined;

const LEVELS = {
  location: [
    { id: "district", label: "District" },
    { id: "upazilla", label: "Upazilla" },
    { id: "dealer", label: "Dealer" },
    { id: "la", label: "LA" },
  ],
  area: [
    { id: "area", label: "Area" },
    { id: "mo", label: "MO" },
    { id: "dealer", label: "Dealer" },
    { id: "la", label: "LA" },
  ],
};

const picker = reactive({ open: false, subject: "dealers" });
// Each layer is one stacked modal: { id, subject, mode, path, level, rows, search, loading, unavailable }
const layers = ref([]);
let layerSeq = 0;

const openPicker = (subject) => {
  picker.subject = subject;
  picker.open = true;
};

const dealerFor = (code, la) =>
  dealerByCode.get(code) ?? {
    code,
    name: la?.dealerName || code || "Unassigned",
    shop: "",
    mobile: "",
    active: false,
    registered: false,
  };

// Flat (LA, dealer) rows that every level groups from.
// Location: one row per LA (dealers are placed by their LAs).
// Area: one row per LA, plus a row for each dealer that has no LA so it still counts.
const baseRows = (mode) => {
  const rows = scopeLas.value.map((la) => ({ la, dealer: dealerFor(la.dealerCode, la) }));
  if (mode === "area") {
    const withLa = new Set(scopeLas.value.map((l) => l.dealerCode));
    for (const d of scopeDealers.value)
      if (!withLa.has(d.code)) rows.push({ la: null, dealer: d });
  }
  return rows;
};

const keyOf = (levelId, row) => {
  const a = areaByDealer.get(row.dealer.code);
  switch (levelId) {
    case "district":
      return [row.la.district, row.la.district];
    case "upazilla":
      return [row.la.upazilla, row.la.upazilla];
    case "area":
      return [a?.areaKey || "unmapped", a?.areaLabel || "Unmapped"];
    case "mo":
      return [a?.moKey || "unmapped", a?.moLabel || "Unmapped"];
    case "dealer":
      return [row.dealer.code, row.dealer.name];
    default:
      return [row.la?.id, row.la?.name];
  }
};

const buildLayerRows = (layer) => {
  const subject = SUBJECTS[layer.subject];
  const levels = LEVELS[layer.mode];

  // Keep only rows matching the subject and every level already drilled into.
  let rows = baseRows(layer.mode).filter((r) =>
    subject.kind === "dealer" ? subject.test(r.dealer) : r.la && subject.test(r.la)
  );
  layer.path.forEach((p, idx) => {
    rows = rows.filter((r) => keyOf(levels[idx].id, r)[0] === p.key);
  });

  if (layer.level.id === "la") {
    return rows.filter((r) => r.la).map(({ la }) => ({ key: la.id, ...la }));
  }

  const groups = new Map();
  for (const r of rows) {
    const [key, label] = keyOf(layer.level.id, r);
    if (!groups.has(key))
      groups.set(key, { key, name: label, dealerSet: new Map(), las: 0, activeLas: 0 });
    const g = groups.get(key);
    g.dealerSet.set(r.dealer.code, r.dealer);
    if (r.la) {
      g.las += 1;
      if (r.la.active) g.activeLas += 1;
    }
  }

  const out = [...groups.values()].map(({ dealerSet, ...g }) => {
    const ds = [...dealerSet.values()];
    const base = {
      ...g,
      dealers: ds.length,
      activeDealers: ds.filter((d) => d.active).length,
    };
    if (layer.level.id === "dealer") {
      const d = ds[0];
      return {
        ...base,
        code: d.code,
        mobile: d.mobile,
        shop: d.shop,
        active: d.active,
        registered: d.registered,
      };
    }
    return base;
  });

  const main =
    subject.kind === "dealer" && layer.level.id !== "dealer" ? "dealers" : "las";
  return out.sort(
    (a, b) => b[main] - a[main] || String(a.name).localeCompare(String(b.name))
  );
};

const refreshLayer = (layer) => {
  layer.unavailable = layer.mode === "area" && areaState.status === "unavailable";
  layer.rows = layer.unavailable ? [] : buildLayerRows(layer);
};

const pushLayer = async (subject, mode, path) => {
  const layer = reactive({
    id: ++layerSeq,
    subject,
    mode,
    path,
    level: LEVELS[mode][path.length],
    rows: [],
    search: "",
    loading: mode === "area" && areaState.status !== "ready",
    unavailable: false,
  });
  layers.value.push(layer);
  if (mode === "area") await fetchAreaMapping();
  layer.loading = false;
  refreshLayer(layer);
};

const startBreakdown = (mode) => {
  picker.open = false;
  pushLayer(picker.subject, mode, []);
};

const drillInto = (layerIndex, row) => {
  const layer = layers.value[layerIndex];
  layers.value.splice(layerIndex + 1); // drop anything stacked above
  pushLayer(layer.subject, layer.mode, [
    ...layer.path,
    { key: row.key, label: row.name },
  ]);
};

// Only the top layer is shown; earlier layers stay in the stack for Back / breadcrumb.
const closeAll = () => {
  layers.value = [];
};
const goBack = () => {
  layers.value.splice(-1);
};
const jumpTo = (index) => {
  layers.value.splice(index + 1);
};

// Breadcrumb: mode label first, then each drilled item, then the current level.
const crumbsOf = () => {
  const top = layers.value[layers.value.length - 1];
  if (!top) return [];
  const mode = MODES.find((m) => m.id === top.mode).label;
  return [mode, ...top.path.map((p) => p.label)];
};

// Columns per level. `link` = drillable, `num` = right-aligned number, `status` = [on, off] text.
const layerColumns = (layer) => {
  const isDealerSubject = SUBJECTS[layer.subject].kind === "dealer";
  const lvl = layer.level;

  if (lvl.id === "la") {
    return [
      { key: "name", title: "LA" },
      { key: "mobile", title: "Mobile" },
      { key: "village", title: "Village" },
      { key: "union", title: "Union" },
      { key: "upazilla", title: "Upazilla" },
      { key: "district", title: "District" },
      { key: "active", title: "Status", status: ["Active", "Inactive"] },
    ];
  }
  if (lvl.id === "dealer") {
    return [
      { key: "name", title: "Dealer", link: true },
      { key: "code", title: "Code" },
      { key: "mobile", title: "Mobile" },
      { key: "active", title: "Status", status: ["Active", "Inactive"] },
      {
        key: "registered",
        title: "Registration",
        status: ["Registered", "Not registered"],
      },
      {
        key: "las",
        title: isDealerSubject ? "LAs" : subjectLabel(layer.subject),
        num: true,
      },
      { key: "activeLas", title: "Active LAs", num: true },
    ];
  }
  const groupCols = [{ key: "name", title: lvl.label, link: true }];
  return isDealerSubject
    ? [
        ...groupCols,
        { key: "dealers", title: subjectLabel(layer.subject), num: true },
        { key: "activeDealers", title: "Active Dealers", num: true },
        { key: "las", title: "LAs", num: true },
        { key: "activeLas", title: "Active LAs", num: true },
      ]
    : [
        ...groupCols,
        { key: "las", title: subjectLabel(layer.subject), num: true },
        { key: "activeLas", title: "Active LAs", num: true },
        { key: "dealers", title: "Dealers", num: true },
      ];
};

const layerTotal = (layer) => {
  if (layer.level.id === "la") return layer.rows.length;
  const isDealerSubject = SUBJECTS[layer.subject].kind === "dealer";
  if (layer.level.id === "dealer")
    return isDealerSubject ? layer.rows.length : sumOf(layer.rows, "las");
  return sumOf(layer.rows, isDealerSubject ? "dealers" : "las");
};

const visibleRows = (layer) => {
  const q = layer.search.trim().toLowerCase();
  if (!q) return layer.rows;
  return layer.rows.filter((r) =>
    [r.name, r.code, r.mobile, r.village, r.union].some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(q)
    )
  );
};

// =====================================================================
// Excel export — filtered sales lines plus district / product summaries
// =====================================================================
const sheetOf = (XLSX, rows, widths) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = widths.map((wch) => ({ wch }));
  return ws;
};

const appliedFilterRows = () => {
  const optionLabel = (key) => {
    const value = applied[key];
    if (!value) return "All";
    return filterOpts[key].find((o) => o.value === value)?.label ?? value;
  };
  return [
    { Filter: "Date Range", Value: periodLabel() },
    ...["area", "mo", "dealer", "la", "product", "portfolio"].map((key) => ({
      Filter: {
        area: "AM",
        mo: "MO",
        dealer: "Dealer",
        la: "LA",
        product: "Product",
        portfolio: "Portfolio",
      }[key],
      Value: optionLabel(key),
    })),
  ];
};

// Export = the SP result sets currently on screen (last Apply Filter), as returned.
const EXPORT_SHEETS = [
  ["main", "kpi", "KPI Cards"],
  ["main", "area", "Area-wise"],
  ["main", "mo", "MO-wise"],
  ["main", "dealer", "Dealer-wise"],
  ["main", "trend", "Monthly Trend"],
  ["lower", "topLA", "Top LAs"],
  ["lower", "laSeg", "LA Segmentation"],
  ["lower", "portfolio", "Portfolio"],
  ["lower", "topProducts", "Top Products"],
  ["lower", "inventory", "Inventory"],
  ["lower", "payment", "Dealer Payment"],
  ["lower", "dueAging", "Due Aging"],
  ["lower", "topDueDealers", "Top Due Dealers"],
];
const exportExcel = async () => {
  const sets = { main: lastMainSets, lower: lastLowerSets };
  const sheets = EXPORT_SHEETS.map(([src, key, name]) => [sets[src][key] ?? [], name]).filter(
    ([rows]) => rows.length
  );
  if (!sheets.length) {
    showNotification("warning", "No data to export for the applied filters");
    return;
  }
  try {
    // Loaded on first export only, so they stay out of the dashboard's initial bundle.
    const [XLSX, { saveAs }] = await Promise.all([import("xlsx"), import("file-saver")]);
    const wb = XLSX.utils.book_new();
    for (const [rows, name] of sheets) {
      XLSX.utils.book_append_sheet(wb, sheetOf(XLSX, rows, Object.keys(rows[0]).map(() => 18)), name);
    }
    XLSX.utils.book_append_sheet(wb, sheetOf(XLSX, appliedFilterRows(), [14, 40]), "Filters");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const { from, to } = periodRange();
    saveAs(file, `Dashboard_${ymd(from)}_to_${ymd(to)}.xlsx`);
  } catch (err) {
    showNotification("error", err?.message || "Failed to export Excel");
  }
};

onMounted(loadAll);
</script>

<style scoped>
/* =====================================================================
   Layout tokens
   ===================================================================== */
.dash {
  --ink: #0f172a;
  --ink-2: #475569;
  --ink-3: #94a3b8;
  --line: #e9edf3;
  --surface: #fff;
  --radius: 16px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.03);
  --shadow-md: 0 12px 28px -14px rgba(15, 23, 42, 0.18);
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  padding-bottom: 8px;
}

/* =====================================================================
   Filter bar
   ===================================================================== */
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 14px;
  padding: 14px 18px;
  margin-bottom: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  animation: kpi-in 0.5s var(--ease) both;
}
.filters__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  align-self: flex-end;
  border-radius: 10px;
  font-size: 18px;
  color: #1d3c78;
  background: #eef2fa;
}
.filters__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 140px;
  min-width: 130px;
  max-width: 200px;
}
.filters__field--date {
  flex: 1 1 250px;
  min-width: 240px;
  max-width: 270px;
}
.filters__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}
/* "Showing 20 of N" hint under a filter dropdown's list */
.filters__limit {
  padding: 6px 12px 4px;
  font-size: 11px;
  color: #8c8c8c;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}
.filters__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.filters__actions :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  border-radius: 8px;
  font-weight: 500;
}
@media (max-width: 640px) {
  .filters__field,
  .filters__field--date {
    max-width: none;
    flex-basis: 100%;
  }
  .filters__actions {
    margin-left: 0;
  }
}

/* =====================================================================
   Hero
   ===================================================================== */
.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 26px 28px;
  margin-bottom: 22px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(120deg, #eef4ff 0%, #f4f1ff 45%, #effbf7 100%);
  border: 1px solid #e3e9f6;
  animation: kpi-in 0.5s var(--ease) both;
}
.hero__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  pointer-events: none;
}
.hero__blob--a {
  width: 220px;
  height: 220px;
  top: -90px;
  right: 22%;
  background: #c7d7fe;
}
.hero__blob--b {
  width: 180px;
  height: 180px;
  bottom: -100px;
  left: 8%;
  background: #d9cffc;
}
.hero__blob--c {
  width: 160px;
  height: 160px;
  top: -40px;
  right: -40px;
  background: #bff0e2;
}
.hero > :not(.hero__blob) {
  position: relative;
  z-index: 1;
}
.hero__date {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--ink-2);
}
.hero__title {
  margin: 4px 0 8px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ink);
  line-height: 1.2;
}
.hero__lead {
  margin: -4px 0 10px;
  font-size: 13px;
  color: var(--ink-2);
}
/* Breed mix */
.mix-chart {
  height: 200px;
}
.mix-legend {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.mix-legend__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
  font-size: 12.5px;
  border-bottom: 1px dashed #eef2f7;
}
.mix-legend__row:last-child {
  border-bottom: 0;
}
.mix-legend__name {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mix-legend__row b {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.mix-legend__pct {
  flex: 0 0 38px;
  text-align: right;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.hero__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 13px;
  color: var(--ink-2);
}
.hero__summary b {
  color: var(--ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hero__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #cbd5e1;
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}
.hero__refresh {
  border-radius: 10px;
}

/* Goal ring (pure CSS conic gradient) */
.hero__goal {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
}
.ring {
  --p: 0;
  flex: 0 0 104px;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#4f46e5 0, #06b6d4 calc(var(--p) * 1%), #e2e8f0 0);
  transition: background 0.6s ease;
}
.ring__inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px #eef2f7;
}
.ring__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.ring__label {
  font-size: 10px;
  color: var(--ink-3);
}
.hero__goal-text {
  min-width: 170px;
}
.hero__goal-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 6px;
}
.hero__goal-line {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 22px;
}
.hero__goal-line b {
  color: var(--ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Segmented control (period / area-MO switch) */
.seg {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--line);
}
.seg__btn {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-2);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.seg__btn:hover {
  color: var(--ink);
}
.seg__btn.is-active {
  color: var(--ink);
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}
.seg--small {
  background: #f1f5f9;
  border-color: transparent;
}
.seg--small .seg__btn {
  padding: 3px 10px;
  font-size: 12px;
}

/* =====================================================================
   Summary cards (8) — white card, colored icon tile, trend + sparkline
   ===================================================================== */
.stat-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}
/* 7 cards, balanced rows with no gaps:
   tablet  → 2 + 2 + 3   (6-col grid)
   laptop  → 4 + 3       (12-col grid)
   wide    → 7 in one row */
@media (min-width: 560px) {
  .stat-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .stat-grid > .stat {
    grid-column: span 3;
  }
  .stat-grid > .stat:nth-child(n + 5) {
    grid-column: span 2;
  }
}
@media (min-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  .stat-grid > .stat {
    grid-column: span 3;
  }
  .stat-grid > .stat:nth-child(n + 5) {
    grid-column: span 4;
  }
}
@media (min-width: 1800px) {
  .stat-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .stat-grid > .stat,
  .stat-grid > .stat:nth-child(n + 5) {
    grid-column: auto;
  }
}

.stat {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  min-height: 116px;
  padding: 14px 14px 12px;
  overflow: hidden;
  text-align: left;
  cursor: default;
  border: 1px solid color-mix(in srgb, var(--c1) 28%, #fff);
  border-radius: 14px;
  /* Each card tinted in its own color, light enough to keep text crisp */
  background: radial-gradient(
      120% 110% at 100% 0%,
      color-mix(in srgb, var(--c1) 22%, #fff) 0%,
      transparent 60%
    ),
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--c1) 13%, #fff) 0%,
      color-mix(in srgb, var(--c1) 5%, #fff) 100%
    );
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04),
    0 6px 16px -10px color-mix(in srgb, var(--c1) 40%, transparent);
  transition: transform 0.25s var(--ease), box-shadow 0.25s ease, border-color 0.25s ease;
  animation: kpi-in 0.45s var(--ease) both;
}
/* Accent strip along the top edge */
.stat::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--c1), var(--c2));
  opacity: 0.85;
}
.stat:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--c1) 45%, #fff);
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05),
    0 16px 28px -14px color-mix(in srgb, var(--c1) 60%, transparent);
}
.stat:active {
  transform: translateY(-1px);
}
.stat:focus-visible {
  outline: 2px solid var(--c1);
  outline-offset: 2px;
}

.stat__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-right: 22px; /* room for the corner arrow */
}
/* Narrow card: icon on top, label + value get the full width */
@container (max-width: 250px) {
  .stat__head {
    flex-wrap: wrap;
    gap: 8px;
  }
  .stat__icon {
    flex-basis: 38px;
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
  .stat__text {
    flex-basis: 100%;
  }
  .stat__head {
    padding-right: 0;
  }
}
.stat__icon {
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 21px;
  color: #fff;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--c2) 75%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: transform 0.25s var(--ease);
}
.stat:hover .stat__icon {
  transform: scale(1.07) rotate(-4deg);
}
.stat__text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.stat__label {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 16px;
  color: #334155;
  /* Always show the full label; wrap to a second line if the card is narrow */
  white-space: normal;
  overflow-wrap: break-word;
}
.stat__value {
  margin: 0;
  /* Scales with the card width so the full value always fits */
  font-size: clamp(16px, 10cqi, 22px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  /* Never cut off: wrap as a last resort */
  white-space: normal;
  overflow-wrap: anywhere;
  animation: kpi-value-in 0.4s ease both;
}
.stat__skeleton {
  height: 28px;
  display: flex;
  align-items: center;
}
.stat__go {
  position: absolute !important;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 10px;
  color: var(--c2);
  background: color-mix(in srgb, var(--c1) 12%, #fff);
  opacity: 0.55;
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease,
    color 0.2s ease;
}
.stat:hover .stat__go {
  opacity: 1;
  color: #fff;
  background: var(--c1);
  transform: translateX(2px);
}

.stat__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
}
.stat__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.stat__hint {
  font-size: 11px;
  line-height: 14px;
  color: #64748b;
  white-space: normal;
}
.stat .trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 700;
}
.stat .trend--good {
  color: #16a34a;
}
.stat .trend--bad {
  color: #b45309;
}

.stat__spark {
  flex: 0 0 80px;
  width: 80px;
  height: 30px;
  overflow: visible;
}
.stat__spark-line {
  fill: none;
  stroke: var(--c1);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

/* Mini progress ring for share cards (pure CSS) */
.stat__ring {
  --p: 0;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 9.5px;
  font-weight: 700;
  color: var(--c2);
  background: radial-gradient(closest-side, #fff 76%, transparent 78%),
    conic-gradient(
      var(--c1) calc(var(--p) * 1%),
      color-mix(in srgb, var(--c1) 14%, #fff) 0
    );
}

@keyframes kpi-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes kpi-value-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* =====================================================================
   Section cards
   ===================================================================== */
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
  animation: kpi-in 0.5s var(--ease) both;
  transition: box-shadow 0.25s ease;
}
.card:hover {
  box-shadow: var(--shadow-md);
}
.card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px 12px;
  margin-bottom: 16px;
}
.card__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.sec-icon {
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 17px;
  color: var(--tone);
  background: var(--tone-soft);
}
.card__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.card__hint {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 2px;
}
.title-chip {
  font-size: 12px;
  font-weight: 500;
  padding: 1px 10px;
  border-radius: 999px;
  color: var(--ink-2);
  background: #f1f5f9;
}

/* Status donuts */
.donut {
  position: relative;
  border: 1px solid #f1f4f8;
  border-radius: 14px;
  padding: 14px 10px 14px;
  cursor: pointer;
  background: linear-gradient(180deg, #fff 0%, #fbfcfe 100%);
  transition: transform 0.25s var(--ease), border-color 0.25s ease, box-shadow 0.25s ease;
}
.donut:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--tone) 30%, #fff);
  box-shadow: 0 12px 24px -16px color-mix(in srgb, var(--tone) 60%, transparent);
}
.donut__title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.donut__title::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tone);
}
.donut__chart {
  height: 190px;
}
.donut__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 14px;
  font-size: 12px;
  color: var(--ink-2);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.legend-item b {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.sample-tag {
  display: inline-block;
  vertical-align: middle;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 4px;
  color: #92400e;
  background: #fef3c7;
}
.count-pill {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  background: #f1f5f9;
  border-radius: 999px;
  padding: 3px 12px;
  white-space: nowrap;
}
.trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  margin-right: 4px;
}
.trend--good {
  color: #15803d;
}
.trend--bad {
  color: #b45309;
}

/* =====================================================================
   Area performance table
   ===================================================================== */
.perf-wrap {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: auto;
  max-height: 440px;
}
.perf-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 13px;
}
.perf-table th,
.perf-table tfoot td {
  position: sticky;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  z-index: 1;
}
.perf-table th {
  top: 0;
}
.perf-table tfoot td {
  bottom: 0;
  color: var(--ink);
  border-top: 1px solid var(--line);
}
.perf-table th,
.perf-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: nowrap;
}
.perf-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.perf-table tbody tr {
  cursor: pointer;
  transition: background 0.15s ease;
}
.perf-table tbody tr:hover td {
  background: #f8fafc;
}
.perf-table tbody tr.is-selected td {
  background: #eef2ff;
}
.perf-table tbody tr.is-selected td:first-child {
  box-shadow: inset 3px 0 0 #4f46e5;
}
.achv-col {
  width: 170px;
}

/* Mini achievement bar inside the table */
.mini-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-bar__track {
  flex: 1 1 auto;
  height: 6px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.mini-bar__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}
.mini-bar__pct {
  flex: 0 0 46px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Achievement level colors (no reds) */
.lvl-high {
  background: linear-gradient(90deg, #6ee7b7, #10b981);
}
.lvl-mid {
  background: linear-gradient(90deg, #93c5fd, #3b82f6);
}
.lvl-low {
  background: linear-gradient(90deg, #cbd5e1, #94a3b8);
}

/* =====================================================================
   Achievement list
   ===================================================================== */
.achv-list {
  max-height: 440px;
  overflow-y: auto;
  padding-right: 4px;
}
.achv-row {
  display: grid;
  grid-template-columns: 22px minmax(70px, 110px) 1fr 52px;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
}
.achv-row__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.achv-row__track {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.achv-row__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.8s var(--ease);
}
.achv-row__pct {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Rank badge */
.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
}
.rank--top {
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
}

/* =====================================================================
   Charts
   ===================================================================== */
.line-chart {
  height: 300px;
}

/* Monthly trend card */
.card--trend {
  background: radial-gradient(
      600px 200px at 0% 0%,
      rgba(99, 102, 241, 0.07),
      transparent 70%
    ),
    radial-gradient(500px 220px at 100% 100%, rgba(16, 185, 129, 0.07), transparent 70%),
    #fff;
}
/* =====================================================================
   Business performance
   ===================================================================== */
.biz__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-bottom: 10px;
}
.biz__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--ink);
}
.biz__path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}
.biz__path-label {
  font-weight: 600;
  color: var(--ink-2);
}
.biz__step {
  font-weight: 600;
  color: #1d3c78;
}
.biz__arrow {
  color: var(--ink-3);
}
.biz-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}
/* Area + Dealer side by side; MO-wise spans the full row below */
@media (min-width: 1024px) {
  .biz-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.biz-card--wide {
  grid-column: 1 / -1;
}
.biz-card {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-top: 3px solid var(--tone);
}
.biz-card .card__head {
  margin-bottom: 8px;
}
.biz-card .sec-icon {
  flex-basis: 30px;
  width: 30px;
  height: 30px;
  font-size: 15px;
  border-radius: 8px;
}
.biz-card .card__title {
  margin: 0;
  font-size: 15px;
}
.biz-chart {
  width: 100%;
  cursor: pointer;
}
/* Fixed-height box; scrolls when there are many rows */
.biz-scroll {
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.biz-scroll--x {
  overflow-x: auto;
  overflow-y: hidden;
}
.biz-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.biz-scroll::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background: #cbd5e1;
}
.biz-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: var(--ink-2);
}
.biz-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.biz-legend i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.biz-legend i.is-line {
  height: 3px;
  border-radius: 2px;
}
.biz-tip {
  margin: auto 0 0;
  padding-top: 10px;
  font-size: 11px;
  color: #64748b;
}
.biz-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.biz-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--ink-2);
  background: var(--tone-soft);
  border: 1px solid color-mix(in srgb, var(--tone) 18%, #fff);
}
.biz-chip b {
  color: var(--tone);
  margin-right: 4px;
}

/* =====================================================================
   LA engagement · Product & portfolio
   ===================================================================== */
.eng-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}
@media (min-width: 1400px) {
  .eng-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /* Inventory + Payment: stacked full width (no empty gap, wide due table) */
  .eng-grid--stack {
    grid-template-columns: minmax(0, 1fr);
  }
}
.eng {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.eng-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  flex: 1;
}
@media (min-width: 768px) {
  .eng-body {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  }
}
.eng-card {
  padding: 12px 14px;
  border-top: 3px solid var(--tone, #0284c7);
  min-width: 0;
}
.eng-card--wide {
  grid-column: 1 / -1;
}
.eng-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 10px;
  margin-bottom: 10px;
}
.eng-card__head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.eng-card__hint {
  font-size: 11px;
  color: #64748b;
}
.eng-scroll {
  max-height: 250px;
  /* Wide tables scroll sideways instead of cutting columns off */
  overflow-x: auto;
}
.eng-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
  margin-bottom: -6px;
  border-top: 1px solid #f1f5f9;
}
/* Long names (Area / MO) wrap so more columns fit */
.eng-table td.wrap {
  white-space: normal;
  min-width: 110px;
  line-height: 1.3;
}

/* Compact tables */
.eng-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.eng-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 8px;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  color: #64748b;
  background: #f8fafc;
  white-space: nowrap;
}
.eng-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}
.eng-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.eng-table td b {
  color: var(--ink);
}
/* Grid variant: column right borders + colourful header
   (Top Products, Top Due Dealers — same look as Portfolio Contribution) */
.eng-table--grid thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
/* !important: beats the global `.app-card table thead …` theme in style.css */
.eng-table.eng-table--grid thead tr {
  background: linear-gradient(
    90deg,
    var(--head-from, #4f46e5),
    var(--head-to, #0ea5e9)
  ) !important;
  /* Rounded top corners, same as the Portfolio Contribution header */
  clip-path: inset(0 round 10px 10px 0 0);
}
.eng-table.eng-table--grid thead th {
  position: static;
  padding: 9px 12px !important;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: transparent !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.35) !important;
}
.eng-table.eng-table--grid tbody td {
  padding: 8px 12px !important;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.eng-table.eng-table--grid thead th:last-child,
.eng-table.eng-table--grid tbody td:last-child {
  border-right: 0 !important;
}
.eng-table tbody tr {
  transition: background 0.15s ease;
}
.eng-table tbody tr:hover td {
  background: color-mix(in srgb, var(--tone, #0284c7) 6%, #fff);
}
.eng-name {
  font-weight: 600;
  color: var(--ink);
}
.eng-sub {
  font-size: 10.5px;
  color: #94a3b8;
}
.eng-table .is-due {
  color: #b45309;
  font-weight: 600;
}
.eng-table .is-up,
.pf-row .is-up {
  color: #16a34a;
  font-weight: 600;
}
.eng-table .is-down,
.pf-row .is-down {
  color: #b45309;
  font-weight: 600;
}
.eng-table .is-new,
.pf-row .is-new {
  color: #2563eb;
  font-weight: 600;
}
.mix {
  display: inline-block;
  min-width: 58px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
.mix--high {
  color: #15803d;
  background: #ecfdf3;
}
.mix--medium {
  color: #1d4ed8;
  background: #eff6ff;
}
.mix--low {
  color: #475569;
  background: #f1f5f9;
}

/* Segmentation tiles */
.seg-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.seg-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  text-align: left;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--c) 28%, #fff);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--c) 14%, #fff),
    color-mix(in srgb, var(--c) 5%, #fff)
  );
  cursor: pointer;
  transition: transform 0.2s var(--ease), box-shadow 0.2s ease;
}
.seg-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px -12px color-mix(in srgb, var(--c) 70%, transparent);
}
.seg-tile--wide {
  grid-column: 1 / -1;
}
.seg-tile__icon {
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 16px;
  color: #fff;
  background: var(--c);
  box-shadow: 0 4px 10px -4px color-mix(in srgb, var(--c) 80%, transparent);
}
.seg-tile__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.seg-tile__label {
  font-size: 11.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--c) 80%, #0f172a);
}
.seg-tile__value {
  font-size: 18px;
  line-height: 22px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.seg-tile__pct {
  font-size: 10.5px;
  color: #64748b;
}

/* Repeat vs one-time */
.repeat {
  display: flex;
  align-items: center;
  gap: 12px;
}
.repeat__chart {
  flex: 1 1 auto;
  min-width: 0;
  height: 190px;
  cursor: pointer;
}
.repeat__legend {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.repeat__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
}
.repeat__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}
.repeat__label i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.repeat__pct {
  font-size: 26px;
  line-height: 30px;
  font-weight: 700;
}
.repeat__count {
  font-size: 11px;
  color: #64748b;
}

/* Portfolio contribution */
.pf-list {
  max-height: 230px;
}
.pf-row {
  display: grid;
  grid-template-columns: 34px minmax(110px, 1.4fr) repeat(5, minmax(62px, 1fr));
  align-items: stretch;
  gap: 0;
  width: 100%;
  padding: 0 6px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}
/* Each column gets a right border (icon + name read as one column) */
.pf-row > span:not(:first-child) {
  display: flex;
  justify-content: center;
  padding: 8px 12px;
  border-right: 1px solid #e2e8f0;
}
.pf-row > span:first-child {
  align-self: center;
  margin: 8px 0;
}
.pf-row > span:last-child {
  border-right: 0;
}
/* Colourful column header */
.pf-row--head {
  position: sticky;
  top: 0;
  z-index: 1;
  border-radius: 10px 10px 0 0;
  border-bottom: 0;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: linear-gradient(90deg, #4f46e5, #0ea5e9);
  white-space: nowrap;
}
.pf-row--head > span:not(:first-child) {
  align-items: center;
  justify-content: flex-start;
  padding-top: 9px;
  padding-bottom: 9px;
  border-right-color: rgba(255, 255, 255, 0.35);
}
.pf-row.pf-row--head:hover {
  background: linear-gradient(90deg, #4f46e5, #0ea5e9);
}
.pf-row:hover {
  background: color-mix(in srgb, var(--c) 7%, #fff);
}
.pf-row__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c) 70%, #fff), var(--c));
}
.pf-row__name {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.pf-row small {
  font-size: 10.5px;
  font-weight: 400;
  color: #94a3b8;
}
.pf-row__stat {
  display: flex;
  flex-direction: column;
  font-size: 12.5px;
}
.pf-row__stat b {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
/* Tk amounts are always right-aligned */
.pf-row__num {
  text-align: right;
  align-items: flex-end;
}
.pf-row.pf-row--head > .pf-row__num {
  justify-content: flex-end;
}

/* Product status chips (no reds) */
.st {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.st--core {
  color: #15803d;
  background: #dcfce7;
}
.st--emerging {
  color: #1d4ed8;
  background: #dbeafe;
}
.st--maintain {
  color: #a16207;
  background: #fef9c3;
}
.st--watch {
  color: #92400e;
  background: #fef3c7;
}
.st--declining {
  color: #475569;
  background: #e2e8f0;
}

/* =====================================================================
   Inventory risk · Payment & due aging
   ===================================================================== */
.biz__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #1d3c78;
  cursor: pointer;
}
.biz__link:hover {
  text-decoration: underline;
}
.risk-card {
  flex: 1;
}
/* Tiles + chips; on wide screens they sit in one strip */
.risk-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}
@media (min-width: 1200px) {
  .risk-layout {
    grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
    gap: 10px;
  }
}
.risk-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (min-width: 640px) {
  .risk-tiles {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
/* KPI tile: clean white surface, coloured accent bar + soft glow */
.risk-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 14px 12px 16px;
  overflow: hidden;
  text-align: left;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--c) 22%, #fff);
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--c) 11%, #fff) 0%,
    color-mix(in srgb, var(--c) 3%, #fff) 70%
  );
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: transform 0.25s var(--ease), box-shadow 0.25s ease, border-color 0.25s ease;
}
.risk-tile::before {
  content: "";
  position: absolute;
  inset: 10px auto 10px 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--c);
}
.risk-tile:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--c) 30%, #fff);
  box-shadow: 0 14px 24px -16px color-mix(in srgb, var(--c) 65%, transparent);
}
.risk-tile__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.risk-tile__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  /* Tone-tinted but dark enough to read on the light fill */
  color: color-mix(in srgb, var(--c) 72%, #0f172a);
}
.risk-tile__icon {
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c) 75%, #fff), var(--c));
  box-shadow: 0 6px 12px -6px color-mix(in srgb, var(--c) 80%, transparent);
  transition: transform 0.25s var(--ease);
}
.risk-tile:hover .risk-tile__icon {
  transform: scale(1.08) rotate(-4deg);
}
.risk-tile__value {
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.risk-tile__value small {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}
.risk-tile__sub {
  font-size: 11px;
  color: #475569;
}
.risk-tile__sub.is-up {
  color: #16a34a;
  font-weight: 700;
}
.risk-tile__sub.is-down {
  color: #b45309;
  font-weight: 700;
}
/* Dealers at risk — one grouped panel with divided stat cells */
.risk-dealers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border-radius: 14px;
  border: 1px solid #e9edf3;
  background: linear-gradient(180deg, #f8fafc, #fff);
}
.risk-dealers__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.risk-dealers__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
}
.risk-dealer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  text-align: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 8%, #fff);
  border: 1px solid color-mix(in srgb, var(--c) 18%, #fff);
  transition: background 0.2s ease, transform 0.25s var(--ease);
}
.risk-dealer:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--c) 13%, #fff);
}
.risk-dealer__icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-bottom: 2px;
  border-radius: 50%;
  font-size: 13px;
  color: #fff;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c) 70%, #fff), var(--c));
  box-shadow: 0 4px 10px -4px color-mix(in srgb, var(--c) 80%, transparent);
}
.risk-dealer__count {
  font-size: 20px;
  line-height: 24px;
  font-weight: 700;
  color: color-mix(in srgb, var(--c) 55%, #0f172a);
  font-variant-numeric: tabular-nums;
}
.risk-dealer__label {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--c) 80%, #0f172a);
  white-space: nowrap;
}

/* Payment tiles */
.pay-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
@media (min-width: 640px) {
  .pay-tiles {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.pay-tile {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--c) 11%, #fff),
    color-mix(in srgb, var(--c) 3%, #fff)
  );
  border: 1px solid color-mix(in srgb, var(--c) 24%, #fff);
  box-shadow: var(--shadow-sm);
  /* Entrance: slide up into place, one card after another (no fade) */
  animation: payTileIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i, 0) * 110ms);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease,
    border-color 0.3s ease;
}
/* Light shine that sweeps across the card on hover */
.pay-tile::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.65) 50%,
    transparent 70%
  );
  transform: translateX(-120%);
}
.pay-tile:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--c) 40%, #fff);
  box-shadow: 0 16px 26px -16px color-mix(in srgb, var(--c) 70%, transparent);
}
.pay-tile:hover::after {
  transform: translateX(120%);
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.pay-tile:hover .pay-tile__icon {
  transform: rotate(-8deg) scale(1.08);
}
@keyframes payTileIn {
  from {
    transform: translateY(18px);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes payIconPop {
  0% {
    transform: scale(0.4) rotate(-20deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pay-tile,
  .pay-tile__icon {
    animation: none;
  }
}
.pay-tile__icon {
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  font-size: 18px;
  color: #fff;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c) 75%, #fff), var(--c));
  box-shadow: 0 6px 12px -6px color-mix(in srgb, var(--c) 80%, transparent);
  /* Icon pops in just after its card lands */
  animation: payIconPop 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
  animation-delay: calc(var(--i, 0) * 110ms + 250ms);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.pay-tile__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.pay-tile__label {
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
}
.pay-tile__value {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.pay-tile__skeleton {
  height: 24px;
}
.pay-tile__delta {
  font-size: 11px;
  font-weight: 700;
}
.pay-tile__delta.is-good {
  color: #16a34a;
}
.pay-tile__delta.is-bad {
  color: #b45309;
}
.pay-tile__delta.is-flat {
  font-weight: 400;
  color: #94a3b8;
}
.pay-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  flex: 1;
}
@media (min-width: 768px) {
  .pay-body {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  }
}
@media (min-width: 1200px) {
  .pay-body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr);
  }
}
.aging-chart {
  height: 230px;
}
.age {
  font-weight: 700;
}
.age--critical {
  color: #92400e;
}
.age--attention {
  color: #ca8a04;
}
.age--normal {
  color: #16a34a;
}
.st--critical {
  color: #92400e;
  background: #fde68a;
}
.st--attention {
  color: #a16207;
  background: #fef9c3;
}
.st--normal {
  color: #15803d;
  background: #dcfce7;
}

.sec-icon--grad {
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #06b6d4 60%, #10b981);
  box-shadow: 0 6px 14px -6px rgba(99, 102, 241, 0.7);
}
.trend-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.trend-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--tone-soft),
    color-mix(in srgb, var(--tone-soft) 40%, #fff)
  );
  border: 1px solid color-mix(in srgb, var(--tone) 14%, #fff);
}
.trend-stat__icon {
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 14px;
  color: var(--tone);
  background: #fff;
}
.trend-stat__label {
  font-size: 11px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trend-stat__value {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trend-chart {
  border-radius: 12px;
  padding: 6px 4px 0;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.6), rgba(255, 255, 255, 0));
}
@media (max-width: 900px) {
  .trend-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.rank-scroll {
  overflow-x: auto;
}
.rank-chart {
  height: 340px;
}

/* =====================================================================
   Top lists
   ===================================================================== */
.top-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 380px;
  overflow-y: auto;
}
.top-list__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 4px;
  border-bottom: 1px dashed #eef2f7;
}
.top-list__row:last-child {
  border-bottom: 0;
}
.top-list__main {
  flex: 1 1 auto;
  min-width: 0;
}
.top-list__line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}
.top-list__name {
  color: var(--ink);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-list__value {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.top-list__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}
.top-list__track {
  flex: 1 1 auto;
  height: 4px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}
.top-list__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--tone) 45%, #fff),
    var(--tone)
  );
}
.top-list__area {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ink-3);
}

/* =====================================================================
   Responsive
   ===================================================================== */
@media (max-width: 1100px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero__goal {
    justify-self: start;
  }
}
@media (max-width: 640px) {
  .hero {
    padding: 20px 18px;
    border-radius: 16px;
  }
  .hero__title {
    font-size: 21px;
  }
  .hero__summary {
    font-size: 12px;
  }
  .hero__goal {
    width: 100%;
    gap: 14px;
    padding: 12px 14px;
  }
  .ring {
    flex-basis: 88px;
    width: 88px;
    height: 88px;
  }
  .ring__inner {
    width: 68px;
    height: 68px;
  }
  .ring__value {
    font-size: 15px;
  }
  .hero__goal-text {
    min-width: 0;
    flex: 1;
  }
  .seg {
    width: 100%;
  }
  .seg__btn {
    flex: 1;
    padding: 6px 8px;
  }
  .seg--small {
    width: auto;
  }
  .card {
    padding: 14px;
    border-radius: 14px;
  }
  .card__hint {
    display: none;
  }
  .stat__value {
    font-size: 21px;
  }
  .line-chart {
    height: 250px;
  }
  .rank-chart {
    height: 300px;
  }
  .achv-row {
    grid-template-columns: 22px minmax(60px, 90px) 1fr 48px;
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero,
  .card,
  .stat,
  .stat__value {
    animation: none;
  }
  .stat,
  .stat__icon,
  .stat__arrow,
  .donut,
  .card {
    transition: none;
  }
}
</style>

<!-- Modals render outside this component, so their styles can't be scoped. -->
<style>
/* Card / modal colors. Global because modals render outside this component. */
/* 12 soft, distinct hues; no reds or pinks */
.tone-slate {
  --tone: #475569;
  --tone-soft: #e6ebf2;
}
.tone-violet {
  --tone: #7c3aed;
  --tone-soft: #ede5fe;
}
.tone-emerald {
  --tone: #047857;
  --tone-soft: #d5f3e6;
}
.tone-sky {
  --tone: #0284c7;
  --tone-soft: #dcf0fb;
}
.tone-orange {
  --tone: #ea580c;
  --tone-soft: #feead9;
}
.tone-yellow {
  --tone: #b88a04;
  --tone-soft: #fcf3c4;
}
.tone-lime {
  --tone: #65a30d;
  --tone-soft: #ebf8d2;
}
.tone-green {
  --tone: #16a34a;
  --tone-soft: #dcf5e3;
}
.tone-teal {
  --tone: #0d9488;
  --tone-soft: #d4f4ee;
}
.tone-cyan {
  --tone: #0891b2;
  --tone-soft: #d6f3fa;
}
.tone-blue {
  --tone: #2563eb;
  --tone-soft: #e0eaff;
}
.tone-indigo {
  --tone: #4f46e5;
  --tone-soft: #e5e4fd;
}
.tone-purple {
  --tone: #9333ea;
  --tone-soft: #f1e5fe;
}

/* ---------- Breakdown modals ----------
   Neutral surfaces and text. The card's tone (--tone) is used only as an accent:
   the top line, icons, and hover highlights. */
.bd-modal .ant-modal-content {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  border-top: 3px solid var(--tone);
  box-shadow: 0 24px 60px -24px rgba(15, 23, 42, 0.35);
}
.bd-modal .ant-modal-header {
  margin: 0;
  padding: 16px 56px 16px 20px;
  background: #fff;
  border-bottom: 1px solid #eef0f3;
}
.bd-modal .ant-modal-close {
  top: 18px;
  inset-inline-end: 16px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #64748b;
  transition: background 0.2s ease, color 0.2s ease;
}
.bd-modal .ant-modal-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}
.bd-modal .ant-modal-body {
  padding: 18px 20px 20px;
  max-height: 75vh;
  overflow-y: auto;
}

.bd-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bd-title-icon {
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  font-size: 18px;
  color: var(--tone);
  background: var(--tone-soft);
}
.bd-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.bd-subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #64748b;
  margin-top: 1px;
}

.bd-back {
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  font-size: 16px;
  color: #334155;
  background: #fff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.bd-back:hover {
  color: var(--tone);
  border-color: var(--tone);
  transform: translateX(-2px);
}
.bd-crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 400;
}
.bd-crumbs__sep {
  color: #cbd5e1;
}
.bd-crumbs__link {
  color: #64748b;
  cursor: pointer;
  text-decoration: underline dotted #cbd5e1;
  text-underline-offset: 3px;
}
.bd-crumbs__link:hover {
  color: #0f172a;
}
.bd-crumbs__current {
  color: #0f172a;
  font-weight: 500;
}
/* Content swaps in place when drilling, with a short fade */
.bd-modal .ant-modal-body > * {
  animation: bd-swap 0.25s ease both;
}
@keyframes bd-swap {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Step 1: choice cards (white; tone shows on the icon and on hover) */
.bd-modal .choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 16px 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.22s ease,
    box-shadow 0.22s ease;
}
.bd-modal .choice:hover {
  transform: translateY(-2px);
  border-color: var(--tone);
  box-shadow: 0 12px 24px -16px rgba(15, 23, 42, 0.35);
}
.bd-modal .choice:hover .choice__icon {
  color: #fff;
  background: var(--tone);
}
.bd-modal .choice__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 20px;
  color: var(--tone);
  background: var(--tone-soft);
  transition: background 0.22s ease, color 0.22s ease;
}
.bd-modal .choice__label {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.bd-modal .choice__path {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
}
.bd-modal .choice__step {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 999px;
  color: #475569;
  background: #f1f5f9;
}
.bd-modal .choice__arrow {
  font-size: 12px;
  color: #cbd5e1;
}

/* Step 2+: table header line */
.bd-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.bd-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}
.bd-head__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.bd-badge {
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 2px 10px;
}

/* Table */
.bd-table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: auto;
  max-height: 60vh;
}
.bd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.bd-table th,
.bd-table tfoot td {
  position: sticky;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  background: #f8fafc;
  z-index: 1;
}
.bd-table th {
  top: 0;
}
.bd-table tfoot td {
  bottom: 0;
  color: #0f172a;
  border-top: 1px solid #e5e7eb;
}
.bd-table th,
.bd-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: nowrap;
}
.bd-table th.text-right,
.bd-table td.text-right {
  text-align: right;
}
.bd-table tbody tr {
  transition: background 0.15s ease;
}
.bd-table tbody tr:hover td {
  background: #f8fafc;
}
.bd-table .tabular {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: #0f172a;
}
.drill-link {
  color: #0f172a;
  font-weight: 500;
  text-decoration: underline dotted #cbd5e1;
  text-underline-offset: 3px;
  cursor: pointer;
}
.drill-link:hover {
  text-decoration-color: var(--tone);
}
.drill-link__icon {
  font-size: 10px;
  margin-left: 2px;
  color: var(--tone);
  transition: transform 0.15s ease;
}
.drill-link:hover .drill-link__icon {
  transform: translateX(2px);
}
.status {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  border-radius: 999px;
  padding: 1px 9px;
}
.status--on {
  background: #ecfdf3;
  color: #15803d;
}
.status--off {
  background: #f1f5f9;
  color: #64748b;
}

/* Modals on small screens */
.bd-modal .ant-modal {
  max-width: calc(100vw - 24px);
}
@media (max-width: 640px) {
  .bd-modal .ant-modal {
    top: 12px;
    padding-bottom: 12px;
  }
  .bd-modal .ant-modal-header {
    padding: 14px 52px 14px 14px;
  }
  .bd-modal .ant-modal-body {
    padding: 14px;
    max-height: calc(100vh - 140px);
  }
  .bd-title {
    font-size: 14px;
  }
  .bd-modal .choice {
    padding: 16px 12px 14px;
  }
  .bd-table th,
  .bd-table td {
    padding: 8px 10px;
  }
}

/* ---------- Business performance detail modal ---------- */
.dt-code {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 10%, #fff);
  vertical-align: middle;
}
.dt-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.dt-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--tone) 6%, #fff);
  border: 1px solid color-mix(in srgb, var(--tone) 18%, #fff);
}
.dt-tile__label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}
.dt-tile__value {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.dt-tile__value.is-up {
  color: #15803d;
}
.dt-tile__value.is-down {
  color: #b45309;
}
.dt-tile__sub {
  font-size: 11px;
  color: #64748b;
}
.dt-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: #f1f5f9;
}
.dt-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  transition: background 0.15s ease, color 0.15s ease;
}
.dt-tab:hover {
  color: var(--tone);
}
.dt-tab.is-active {
  color: var(--tone);
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}
.dt-tab__count {
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10.5px;
  color: #475569;
  background: #e2e8f0;
}
.dt-tab.is-active .dt-tab__count {
  color: #fff;
  background: var(--tone);
}
.dt-table-wrap {
  max-height: 50vh;
}
.dt-rate {
  display: inline-block;
  min-width: 52px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  text-align: center;
}
.dt-rate.is-high {
  color: #15803d;
  background: #ecfdf3;
}
.dt-rate.is-mid {
  color: #a16207;
  background: #fefce8;
}
.dt-rate.is-low {
  color: #92400e;
  background: #fef3c7;
}
</style>
