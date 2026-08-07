# QA/BA audit — Chất lượng sản phẩm AnViet CRM

**Ngày audit:** 25/07/2026  
**Phạm vi:** review tĩnh toàn bộ luồng UI → API → service → PostgreSQL, không chỉnh sửa code.  
**Kết luận ngắn:** đây là một **vertical slice CRM có dữ liệu thật và một số transaction quan trọng**, vượt mức prototype UI. Tuy vậy, ở trạng thái hiện tại nó **chưa đạt chuẩn product/production để vận hành thật**. Nền luồng bán hàng có thể demo tốt; các kiểm soát phân quyền theo người phụ trách, tính nhất quán liên kết, quản trị vòng đời chứng từ, giao việc cá nhân, test E2E và vận hành vẫn mang tính MVP.

## 1. Cách đánh giá và thước đo

Một luồng chỉ được xếp “product-ready” khi thỏa đồng thời:

1. Người dùng thao tác được từ UI, có loading/empty/error/permission state.
2. API xác thực, phân quyền và validate dữ liệu **ở server**.
3. Dữ liệu tham chiếu đúng thực thể, đúng customer/owner và có ràng buộc/transaction khi cần.
4. State transition rõ, không thể nhảy trạng thái hay sửa/xóa sai chứng từ.
5. Có audit, khả năng truy vết và test cho happy path lẫn lỗi/race condition.
6. Có thể mở rộng: phân trang thật, query/index phù hợp, không N+1 ở màn hình chính.

Phân loại dùng trong báo cáo:

| Mức | Ý nghĩa |
|---|---|
| **Đạt nền tảng** | Có luồng thật và kiểm soát cốt lõi; còn hạng mục nâng cấp trước production. |
| **MVP vận hành có kiểm soát** | Demo/POC được, nhưng vẫn có rủi ro nghiệp vụ, UX hoặc vận hành. |
| **Chưa đạt** | Không nên tuyên bố tính năng hoàn chỉnh hay dùng cho dữ liệu thật. |

## 2. Kết luận điều hành

| Khu vực | Mức hiện tại | Nhận định QA/BA |
|---|---|---|
| Đăng nhập, session, đổi mật khẩu | Đạt nền tảng | Có Argon2, cookie HttpOnly, session DB, bắt đổi mật khẩu và revoke session khi khóa user. Cần loại bỏ credentials mặc định khỏi form, rate-limit và harden CSRF/session. |
| Vai trò/quyền | MVP vận hành có kiểm soát | Có role × permission × all/own và server check. Cách áp dụng `own` không nhất quán, đặc biệt task/contact/payment/document/inventory/campaign. |
| Lead → customer/contact/deal | Đạt nền tảng | Convert có transaction + lock + audit; chưa kiểm soát ownership/duplicate/transition đầy đủ. |
| Khách hàng/workspace | MVP vận hành có kiểm soát | Có dữ liệu liên kết và workspace; dữ liệu child trả về không được scope lại theo quyền customer/owner. |
| Công việc/giao việc | MVP vận hành có kiểm soát | Có `owner_id`, due date, liên kết customer/lead/deal, status. Chưa phải work-management cá nhân hoàn chỉnh. |
| Cơ hội | MVP vận hành có kiểm soát | Có pipeline và lý do won/lost, nhưng có thể nhảy trạng thái/reopen tùy ý, không kiểm tra contact thuộc customer. |
| Báo giá → đơn → kho → hóa đơn → thu tiền | Đạt nền tảng cho happy path | Transaction/row lock ở approve, confirm, payment là điểm tốt. Thiếu kiểm soát liên kết, quyền nghiệp vụ và vòng đời hủy/điều chỉnh. |
| Kho | MVP vận hành có kiểm soát | Post stock move/confirm order có lock balance và chống âm. Điều kiện loại phiếu/kho còn lỏng; user own không được scope nhất quán. |
| Marketing | MVP vận hành có kiểm soát | CRUD create/update có thật, attribution campaign → lead có thật. Delete UI nhưng API/service không hỗ trợ; stats tạo N+1. |
| Hợp đồng | Chưa đạt như CRUD độc lập | Hợp đồng được sinh khi duyệt báo giá là hợp lý; UI lại hiển thị create/edit/delete dù hook chủ động ném lỗi/no-op và API không có write route. |
| Tài chính | MVP vận hành có kiểm soát | Payment atomic và không thu vượt là tốt. Chưa có hủy/reverse payment, credit note, due-date policy/overdue workflow, segregation-of-duties. |
| Tài liệu | Chưa đạt | Chỉ lưu metadata + `storageKey`, không có upload/download/storage authorization và entity polymorphic không được kiểm tra tồn tại/quyền. |
| Analytics | MVP vận hành có kiểm soát | Có endpoint aggregate SQL dữ liệu thật. Chưa thấy filter thời gian, scope dữ liệu theo user, định nghĩa KPI/đối soát và kiểm thử. |
| Test/quality gate | Chưa đạt production | Chỉ 7 unit test validation; không E2E, integration DB, authorization, transaction/race-condition hay migration test. |

## 3. Luồng theo chiều dọc

### 3.1 Auth, user và RBAC

**Đã đảm bảo**

- Password hash Argon2, session token chỉ lưu hash trong DB; cookie `HttpOnly`, `Secure` ở production, `SameSite=Lax`.
- User inactive bị loại ở `getCurrentUser`; khi admin inactive user thì session đang hoạt động bị revoke.
- `must_change_password` được chặn ở CRM layout và business API.
- Không cho tự vô hiệu hóa chính mình hay gỡ Super Admin cuối cùng.

**Khoảng hở chất lượng**

1. **P0 — Không được đưa vào production:** form đăng nhập tự điền `admin@anviet.local / Admin@123`. README cũng công khai credential seed. Nếu database seed/volume bị dùng nhầm môi trường public, đây là account takeover trực tiếp.
2. **P1:** không thấy rate limit, lockout/backoff theo IP/tài khoản, reset password, MFA, quản lý thiết bị/session, log cảnh báo bất thường.
3. **P1:** middleware chỉ kiểm tra cookie có tồn tại; tính hợp lệ và `must_change_password` do route/layout kiểm tra sau đó. Không sai về bảo mật nếu mọi API đều check, nhưng gây bề mặt bảo vệ không đồng nhất và không phải policy layer rõ ràng.
4. **P0/P1 — RBAC scope không đáng tin cậy toàn cục:** `requirePermission()` chỉ xác minh `own` khi caller truyền đúng `ownerId`; một số endpoint không truyền owner (task, contact, campaign, stock move, payment, document). Với code hiện tại, user chỉ có quyền `own` sẽ bị từ chối sai ở các endpoint này; nếu sau này workaround bằng cách bỏ owner check thì sẽ thành lỗ hổng vượt phạm vi. Cả hai đều không phải authorization product-grade.
5. **P1:** tạo/chuyển owner nhận `ownerId` từ client nhưng không có permission `assign/reassign`, không xác minh user đích active/tồn tại theo business rule. Foreign key chỉ bảo vệ sự tồn tại, không bảo vệ quyền giao việc.

**Kết luận:** nền auth tốt hơn MVP thường thấy, nhưng RBAC chưa đủ tin cậy để phân quyền nhân sự thật.

### 3.2 Lead → khách hàng → liên hệ → cơ hội

**Đã đảm bảo**

- Lead có owner/campaign/notes/status; qualify, disqualify có audit và lost bắt buộc lý do.
- Convert dùng transaction + `FOR UPDATE`, ngăn convert hai lần, tạo customer/contact/deal rồi cập nhật lead + audit.
- Customer, contact, deal có FK nền tảng; customer bị chặn soft-delete khi còn quote/order/contract/invoice.

**Chưa đảm bảo / rủi ro**

1. **P1:** không có duplicate detection/merge (email/phone/company) trước khi tạo lead/customer hay khi convert. Một lead convert lặp dữ liệu khác sẽ tạo customer trùng.
2. **P1:** validate chỉ xác nhận UUID, không xác nhận campaign/owner/customer/contact còn active, tồn tại theo rule hay người thao tác được quyền truy cập bản ghi cha.
3. **P1:** `deal.contact_id` không bị ràng buộc phải thuộc `deal.customer_id`; quote có thể nhận `deal_id` của customer khác. FK riêng lẻ không bảo vệ tính nhất quán nghiệp vụ này.
4. **P1:** `changeDealStage` chấp nhận bất kỳ stage hợp lệ từ bất kỳ stage hiện tại; deal won/lost có thể quay lại new/negotiation, không có transition matrix, không có closed_at, lý do thắng/thua không chuẩn hóa.
5. **P1:** activity/task có thể truyền đồng thời customer/lead/deal không liên quan nhau. Điều này làm timeline và báo cáo sai nguồn dữ liệu.
6. **P2:** customer workspace tải nhiều collection song song, nhưng các query child chỉ lọc `customer_id`; không có kiểm tra ownership/per-record scope của từng child khi vào workspace.

**Đánh giá:** luồng convert đủ mạnh để demo và pilot có giám sát; chưa nên dùng làm master data/customer ownership chính thức.

### 3.3 Giao việc và dữ liệu gắn với user

**Câu trả lời trực tiếp:** đã có **giao việc cơ bản**, chưa có **quản trị công việc cá nhân đủ product**.

**Đã có**

- Bảng `tasks` lưu `owner_id`, `created_by`, `updated_by`, `due_at`, `status`, và liên kết customer/lead/deal.
- Form/hook cho phép tạo task với user cụ thể; list có filter owner/customer và có view ngày/kanban/tuần ở UI.
- Task được hiển thị trong workspace customer và analytics có định hướng task quá hạn.

**Thiếu để gọi là tính năng giao việc cá nhân hoàn chỉnh**

1. **P0:** PATCH/DELETE task gọi `requirePermission("tasks", action)` mà không load task và truyền `task.owner_id`. Với implementation hiện tại, user chỉ có quyền `own` sẽ bị từ chối cả task của mình; list lại scope owner. Update/delete vì thế mâu thuẫn với list và không thể coi là quyền cá nhân hoàn chỉnh.
2. **P1:** giao owner bất kỳ qua client không kiểm tra quyền giao/reassign; người được giao không được xác nhận active, không có team/manager scope.
3. **P1:** không có assignment history (ai giao, giao từ ai, khi nào đổi), comment/discussion, follower/mention, notification/in-app inbox/email, reminder/escalation quá hạn, recurring task, attachment/link validation hay SLA/priority.
4. **P1:** status chỉ `open/done/cancelled`; không có transition rule, lý do cancel, completed_at/completed_by, reopen policy. Một task có thể đổi done ↔ open tùy ý, không audit lifecycle.
5. **P1:** không có “My work” server-side được định nghĩa rõ (today/overdue/upcoming) và không có dashboard workload theo user/team. Các filter thời gian/type đang lọc ở client sau khi lấy tối đa 100 bản ghi.
6. **P1:** contact không có owner mà list `contacts` đặt `ownerColumn: null`; own-scope contact không thể phản ánh quyền theo customer owner. PATCH/DELETE contact cũng không truy ngược customer để kiểm quyền.
7. **P2:** activity có owner creator nhưng không có update/delete, không có participant/outcome chuẩn hóa; task/activities liên kết nhiều thực thể nhưng không enforce quan hệ.

**Dữ liệu “gắn với user” hiện có:** owner cho lead/customer/deal/task/campaign/quote/order/contract/invoice/payment/stock move/activity, audit `actor_id`, và created/updated_by ở nhiều bảng.  
**Điểm thiếu:** owner không đồng nghĩa entitlement. Chưa có policy thống nhất “người được giao / người tạo / quản lý / team” được xem-sửa-giao lại gì, và các endpoint chưa thực thi policy đó nhất quán.

### 3.4 Báo giá → hợp đồng/đơn → kho → hóa đơn → thanh toán

**Điểm mạnh đáng giữ**

- Quote line được tính tổng ở server; chỉ product active được đưa vào quote; quote draft mới sửa, draft mới send, sent mới approve/reject.
- Approve quote nằm trong transaction, lock quote, tạo contract/order và copy lines; `quote_id UNIQUE` giúp bảo vệ một quote chỉ có một contract/order.
- Confirm order lock order và inventory balances, kiểm tồn, tạo phiếu xuất posted + invoice + update order trong một transaction.
- Payment lock invoice, chặn thu vượt và cập nhật paid amount/status atomic. Đây là các điểm đã vượt “chạy được UI”.

**Các khoảng hở quan trọng**

1. **P0:** record payment chỉ kiểm `finance:create` mà không load invoice để kiểm theo `invoice.owner_id`. Với implementation hiện tại, role chỉ có scope `own` bị từ chối do owner không được truyền; đồng thời policy đúng cho “ai được ghi nhận thu hộ invoice/customer nào” chưa tồn tại. Cần tách quyền `record_payment` và kiểm quyền trên invoice/customer.
2. **P1:** không có rule quote.deal thuộc quote.customer, order/contract/invoice cross-reference nhất quán, hoặc customer active trước khi lập chứng từ.
3. **P1:** chưa có vòng đời hủy/void/reverse/adjustment cho order, invoice, payment, stock move. Không thể sửa chứng từ posted là đúng, nhưng không có chứng từ điều chỉnh/reversal nên vận hành thật sẽ bế tắc hoặc buộc sửa DB.
4. **P1:** thiếu idempotency key cho POST tác động tiền/tồn. Lock giảm race condition, nhưng retry HTTP sau timeout có thể tạo payment khác hoặc cần trả lại kết quả nhất quán; workflow nội bộ không có request id.
5. **P1:** approve quote dùng `ON CONFLICT ... DO UPDATE`, sau đó xóa và copy `order_lines`; nhánh conflict đáng lẽ không xảy ra sau status/lock, nhưng nếu xảy ra có nguy cơ ghi lại order đã tồn tại. Cần explicit idempotency/return existing thay vì UPDATE side effect.
6. **P1:** giá/chiết khấu quote lấy `unitPrice` từ client (được validate số nhưng không có price-list/approval floor); phù hợp CRM đơn giản nhưng không đủ sales control. Order draft cũng cho unit price tùy ý.
7. **P1:** invoice due date cố định `current_date + 30`, không lấy điều khoản hợp đồng/customer; không có overdue state, dunning/collection workflow hay đối soát payment.
8. **P2:** `orders` không có DELETE/cancel route, nhưng UI/hook vẫn có remove no-op; đây là hành vi gây hiểu nhầm nghiệp vụ.

**Đánh giá:** happy path quote-to-cash là phần mạnh nhất. Đạt nền tảng transaction, chưa đạt accounting/operations product vì thiếu exception handling và authorization chuẩn.

### 3.5 Sản phẩm, kho và tồn

**Đã có**

- SKU unique, qty > 0, balance theo `(warehouse_id, product_id)`.
- Phiếu xuất manual/order post kiểm tra tồn và lock balance; status posted chặn post lặp; phiếu posted không xóa được bằng service.
- Cảnh báo minimum stock và lịch sử move có UI.

**Thiếu/rủi ro**

1. **P1:** schema/validation không ép rule theo loại move: `in` vẫn có thể không có destination, `out` thiếu source, `transfer` thiếu cả hai hoặc source=destination. Business service không kiểm tra warehouse tồn tại/khác nhau trước khi post theo đầy đủ loại.
2. **P1:** stock move GET/delete/post chỉ dùng permission inventory không gắn `owner_id`; own scope không hoạt động như mô hình khai báo.
3. **P1:** soft-delete product không kiểm tra reference từ quote/order/stock moves. Inactive có thể là đúng, nhưng need policy rõ: snapshot lịch sử, chặn delete, replacement SKU, unit conversion.
4. **P1:** warehouse CRUD chỉ có list endpoint, chưa có quản trị warehouse/default warehouse an toàn. `is_default` không có partial unique index bảo đảm chỉ một kho default.
5. **P2:** không thấy stock reservation/allocation; tồn chỉ bị trừ khi confirm order. Có thể oversell nhiều order draft/sent trong vận hành thực.

### 3.6 Marketing, documents và analytics

**Marketing:** campaign → lead có FK và campaign stats có thật. Tuy nhiên campaign update không scope owner; `remove` hook no-op trong khi UI có delete dialog. Stats được gọi từng campaign từ list (N+1), sẽ chậm khi dữ liệu tăng. Không có UTM/import/lead attribution rule, ROI definition theo paid/revenue và lifecycle budget approval.

**Documents — chưa đạt:** API chỉ nhận metadata do client gửi. `entity_type` là string tự do; không xác minh entity tồn tại, người upload có quyền với entity, storage key có thuộc tenant hay file đã upload không. UI đang lưu URL/key chứ không có upload/download signed URL, virus scan, MIME/content validation, delete/retention/audit. Không dùng cho tài liệu hợp đồng thật.

**Analytics:** có data aggregate server-side là hướng đúng. Cần chốt source-of-truth (revenue là invoice paid hay invoice issued), timezone/date range, filter team/owner, quyền scope và reconciliation. Analytics endpoint hiện chỉ check `analytics:view` không có owner context; role own hoặc bị chặn, hoặc nếu cấp all sẽ xem toàn bộ.

## 4. Những dấu hiệu MVP rõ ràng

1. Mọi service list phía UI chủ yếu ép `pageSize: 100`, sau đó lọc type/channel/date ở client; bảng UI chưa vận hành server-side pagination theo chuẩn đã mô tả trong BA doc.
2. `contracts` hook: create/update ném lỗi, delete/removeMany no-op; `orders` remove no-op; `marketing` remove ném “chưa hỗ trợ”. UI lại dựng dialog thao tác tương ứng.
3. Detail view của đa số module là drawer, trong khi chuẩn dự án yêu cầu modal; đây là UX consistency gap, không phải lỗi chức năng.
4. Chỉ có 2 file test với 7 assertion validation. Checklist BA tự ghi mọi luồng “cần bổ sung E2E”.
5. Nhiều enum nghiệp vụ ở DB là `varchar` không CHECK/enum: status lead/deal/quote/order/invoice/task/campaign/stock move, loại move, method payment… Validation API giảm rủi ro nhưng DB vẫn không tự bảo toàn khi có script/integration khác.
6. Index hiện chủ yếu cho owner/status/due và audit/documents. Search `ILIKE`, FK joins, list sort và báo cáo lớn chưa có index chuyên dụng/EXPLAIN plan; code đếm tổng mọi list cũng có thể thành bottleneck.

## 5. Backlog ưu tiên theo rủi ro

### P0 — chặn release production

| Việc | Tiêu chí nghiệm thu |
|---|---|
| Bỏ credential mặc định khỏi login UI/README production; secret bootstrap chỉ qua deploy secure | Không có mật khẩu hợp lệ trong source/UI; first admin provision qua biến bí mật/one-time setup; CI secret scan. |
| Chuẩn hóa authorization record-level | Mọi GET/list/create/update/delete/command load target/parent ở service và evaluate all/own/team nhất quán. Tạo test matrix user A/user B/admin cho task, contact, payment, document, inventory, campaign. |
| Bảo vệ task/payment/document ownership | Own user không thể sửa/xóa task người khác, ghi thu invoice người khác, hay tạo/xem document của entity ngoài phạm vi. |
| Làm UI trung thực với API | Ẩn/disable contract create/edit/delete, campaign delete, order delete cho tới khi endpoint/flow thật tồn tại; không dùng no-op cho action destructive. |

### P1 — bắt buộc trước pilot vận hành dữ liệu thật

| Việc | Tiêu chí nghiệm thu |
|---|---|
| Thiết kế policy giao việc | `assign/reassign`, assignee active, created/assigned/completed/cancelled history, completed_at/by, priority, reminder/overdue, My Work server-side và notifications tối thiểu. |
| Enforce relational invariants | Contact thuộc customer của deal; deal thuộc customer của quote; activity/task links nhất quán; verify parent active + access. Dùng service validation và DB constraint/trigger khi cần. |
| State machine chứng từ | Bảng transition cho lead/deal/task/quote/order/stock/invoice/payment; closed/cancel reason, approved/posted timestamps; chỉ service command được chuyển state. |
| Exception/reversal finance & inventory | Cancel/void/reverse payment, credit note, stock adjustment/reversal, audit before/after và transaction/idempotency. Không sửa trực tiếp posted data. |
| Documents thật | Upload presigned/signed download, allowlist entity type, authorize entity, object ownership/path policy, MIME/size/content scan và retention/delete audit. |
| Test theo luồng | Integration DB + E2E: login/RBAC, lead convert concurrency, quote approval idempotency, insufficient stock concurrent confirms, overpayment concurrent requests, ownership bypass cases. |

### P2 — chuẩn hóa product/scale

| Việc | Tiêu chí nghiệm thu |
|---|---|
| Pagination/filter/sort thật | URL state, page/pageSize/total, DB filter thay client filter, no `pageSize:100` as normal behavior, no N+1 campaign/order detail load. |
| Data integrity & performance | DB CHECK/enum/constraints, indexes FK/search/sort, `EXPLAIN ANALYZE` các list/analytics lớn, unique default warehouse. |
| UX vận hành | Permission state, submit disabled/retry, confirm đúng command; modal detail theo design standard, accessible keyboard/error messages. |
| Observability/compliance | Structured error logging, audit coverage write operations, metrics, backup/restore drill, migration/versioning process, retention policy. |

## 6. Test evidence của audit

Đã chạy trên working tree hiện tại:

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| `npm test` | Pass: 2 files, 7 tests | Chỉ cover schema validation; không chứng minh flow/API/DB/RBAC. |
| `npm run lint` | Pass với 9 warnings | Warnings tập trung hook stub/no-op (contracts, marketing, orders), là chỉ báo feature chưa hoàn tất. |
| `npm run build` | Chưa có kết quả xác nhận cuối | Lần chạy song song gặp lock của một tiến trình build khác; cần chạy lại tuần tự trong CI sạch. |
| E2E/integration DB | Không có | Đây là khoảng trống release-critical cho CRM có tiền/tồn/quyền. |

## 7. Quyết định khuyến nghị

- Có thể gọi hệ thống là: **“CRM MVP tích hợp PostgreSQL, có happy-path sales workflow và transaction cốt lõi.”**
- Không nên gọi là: **“CRM production-ready / quản trị giao việc cá nhân đầy đủ / RBAC theo user đã đảm bảo / kế toán-kho sẵn sàng vận hành.”**
- Khuyến nghị release: chỉ **internal demo hoặc pilot dữ liệu không nhạy cảm với Super Admin giám sát** sau khi xử lý P0; chưa mở rộng cho nhiều phòng ban hoặc tiền/tồn thật trước P1.

## 8. Các file/mã nguồn chính đã đối chiếu

- `docs/BA_PRODUCT_FLOWS.md`, `README.md`
- `database/init/001_schema.sql`, `database/init/002_seed.sql`
- `features/auth/services/auth-service.ts`, `features/auth/services/users-service.ts`, `features/auth/services/roles-service.ts`
- `features/crm/services/crm-service.ts`, `features/crm/services/domain-service.ts`, `features/sales/services/sales-workflow-service.ts`
- `features/crm/validation.ts` và toàn bộ `app/api/v1/*`
- UI/hook của tasks, customers, quotes, orders, contracts, marketing, inventory, finance, analytics và settings.
