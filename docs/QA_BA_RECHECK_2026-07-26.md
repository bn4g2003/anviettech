# QA/BA re-check sau sửa — AnViet CRM

**Ngày kiểm tra:** 26/07/2026  
**Cơ sở đối chiếu:** [QA_BA_PRODUCT_QUALITY_AUDIT_2026-07-25.md](./QA_BA_PRODUCT_QUALITY_AUDIT_2026-07-25.md)  
**Phương pháp:** review lại UI → API → service → PostgreSQL theo source hiện tại; chạy test, lint và production build. Không chỉnh sửa code nghiệp vụ.

## Cập nhật sau khi xử lý các tồn đọng có thể patch tại chỗ

- **Đã xử lý P0 migration:** compose có service `migrate` chờ PostgreSQL healthy và chạy các SQL idempotent trong `database/migrations`; migration task column được chuyển khỏi `database/init`.
- **Đã xử lý P1 owner reassignment:** PATCH customer/lead/deal dùng cùng policy `resolveOwnerForCreate` như task/campaign và ghi audit `reassign`.
- **Đã xử lý P1 parent access:** create task/activity yêu cầu user có quyền `view` trên mọi customer/lead/deal được gắn.
- **Đã xử lý P1 kho:** transfer source/destination phải khác nhau; warehouse phải tồn tại và active trước khi tạo phiếu.
- **Đã sạch lint:** hook legacy không còn unused parameter warning. Quality gate mới: 16 tests pass, lint pass không warning, Docker Compose config hợp lệ, production build pass.

Các hạng mục vẫn cần roadmap riêng: upload/document storage thực, login rate-limit/lockout dùng shared store, integration/E2E với PostgreSQL và DB constraints/migration tracking hoàn chỉnh.

## Kết luận trước cập nhật patch

Đợt sửa này **có chất lượng và đã xử lý được đa số điểm P0 về authorization/luồng trước đó**. Hệ thống hiện tiến gần hơn tới **MVP vận hành có kiểm soát**; chưa đạt production-ready do còn rủi ro migration triển khai, phân quyền khi chuyển owner ở một số module, thiếu kiểm tra quyền bản ghi cha khi gắn task/activity, và thiếu test tích hợp/E2E.

| Nhóm trước đây | Trạng thái re-check | Bằng chứng |
|---|---|---|
| Credential tự điền ở login | **Đã xử lý** | Login page khởi tạo email/password rỗng; README đánh dấu seed account chỉ local/dev. |
| RBAC `own` cho task | **Đã xử lý** | PATCH/DELETE load task rồi truyền `task.ownerId` vào `requirePermission`; create/reassign dùng `resolveOwnerForCreate`. |
| RBAC payment theo invoice | **Đã xử lý** | POST payment load invoice rồi check `finance:create` theo `invoice.ownerId` trước khi ghi nhận. |
| RBAC contact theo customer | **Đã xử lý** | Contact GET list own scope qua customer owner; create/update/delete truy ngược customer owner để authorize. |
| RBAC document/entity tùy ý | **Đã xử lý một phần** | `entityType` allowlist, entity phải tồn tại và permission được check theo entity owner. Chưa có upload/storage lifecycle thật. |
| Assign owner tùy ý lúc tạo/reassign task/campaign | **Đã xử lý một phần** | `resolveOwnerForCreate` giới hạn scope own → self và kiểm tra target active khi giao người khác. Chưa áp dụng cho mọi PATCH có `ownerId`. |
| Quan hệ customer/contact/deal/quote | **Đã xử lý** | Có relation guards: contact phải thuộc customer deal; deal phải thuộc customer quote; task/activity kiểm tra liên kết cơ bản. |
| State deal/task | **Đã xử lý** | Có transition matrix, chặn reopen deal closed; task hoàn thành có `completed_at/by`, hủy cần notes. |
| UI action giả/no-op | **Đã cải thiện** | Gỡ dialog/action create-edit-delete khỏi màn hợp đồng; gỡ delete marketing và delete order khỏi page. Hook legacy vẫn còn no-op. |
| Kiểm thử | **Cải thiện nhưng chưa đủ** | Từ 7 lên 15 test: validation, permission matcher, state machines; vẫn không integration DB/E2E. |

## Điểm đã đạt và giá trị thực tế

### 1. Task/giao việc đã tiến bộ đáng kể

- User chỉ có quyền `tasks:update/delete:own` hiện sửa/xóa được task của mình và bị chặn với task của người khác.
- Khi create/reassign, quyền own chỉ được giao cho chính mình; quyền all mới giao user khác, và user đích phải active.
- Reassign được ghi audit; task done lưu `completed_at`, `completed_by`; reopen chỉ dành cho người có `tasks:update:all`.
- API đã có filter server-side `scope=my`, `due=overdue|today|upcoming`, status/type/owner. Đây là bước đúng hướng cho “việc của tôi”.

**Đánh giá:** từ “task có owner” đã lên **work item có ownership và state control cơ bản**. Chưa có notification, assignment history đầy đủ, SLA/priority/comment/follower hay dashboard workload team nên chưa gọi là hệ thống giao việc product hoàn chỉnh.

### 2. Quyền theo owner đã được sửa đúng ở các luồng nhạy cảm

- `tasks/[id]`, `contacts/[id]`, `payments`, `documents`, `stock-moves/[id]`, `campaigns/[id]` đã load target hoặc entity owner trước authorization.
- Document không còn nhận entity type tự do: chỉ customer, lead, deal, quote, order, contract, invoice, campaign; entity không tồn tại trả lỗi trước khi list/create.
- List contacts own scope dùng `EXISTS` qua `customers.owner_id`, thay vì trả toàn bộ contacts.

### 3. Tính đúng quan hệ và workflow tốt hơn

- Deal tạo/sửa contact kiểm tra contact thuộc customer.
- Quote create/update kiểm tra deal thuộc customer quote.
- Activity/task guard liên kết customer/lead/deal; không còn chấp nhận ngay các UUID rời rạc như trước.
- Stock move đã bắt buộc kho nhập/xuất theo type.
- Deal không thể nhảy/reopen stage closed tùy ý; task cancel có lý do.

## Các lỗi/rủi ro còn lại

### P0 — cần xử lý trước khi deploy bản cập nhật vào database đang có dữ liệu

1. **Migration `003_tasks_completed.sql` không tự chạy với existing volume.**

   Docker chỉ mount `database/init` vào `docker-entrypoint-initdb.d`; PostgreSQL image chỉ chạy các script đó khi khởi tạo data directory/volume lần đầu. README cũng ghi rõ điều này. File `003_tasks_completed.sql` được chú thích “migration for existing volumes”, nhưng không có migration runner, command hay hướng dẫn thực thi thủ công.

   **Hậu quả:** database đã được tạo trước đợt sửa sẽ thiếu `tasks.completed_at` và `tasks.completed_by`; endpoint create/update/get task nay SELECT/RETURNING hai cột này, dẫn tới lỗi runtime `column does not exist`.

   **Yêu cầu nghiệm thu:** dùng migration tool/script versioned chạy một lần, có bảng migration/version hoặc ít nhất command deploy rõ ràng; kiểm thử upgrade từ schema cũ và rollback/backup. Không chỉ để file SQL trong init folder.

### P1 — authorization và integrity còn chưa đồng nhất

2. **PATCH customer/lead/deal vẫn cho đổi `ownerId` mà không gọi `resolveOwnerForCreate`.**

   Route kiểm quyền update trên owner hiện tại là đúng, nhưng body PATCH vẫn đi thẳng tới service cập nhật `owner_id`. Vì vậy người có `update:own` có thể chuyển customer/lead/deal của mình sang user bất kỳ (hoặc nhận DB FK error nếu UUID không tồn tại), bỏ qua policy “own chỉ self, all mới giao lại” vừa được áp dụng cho task/campaign.

   **Yêu cầu:** tái dùng `resolveOwnerForCreate(user, module, "update", ownerId)` ở customer/lead/deal PATCH và ghi audit `reassign` với before/after.

3. **Create task/activity không kiểm quyền với parent record được gắn vào.**

   Relation guard chỉ kiểm entity tồn tại/quan hệ. User có `tasks:create:own` có thể tạo task own gắn vào customer/deal/lead ngoài phạm vi xem của họ nếu biết UUID; tương tự activity. Task/activity này sau đó xuất hiện trong workspace của chủ customer.

   **Yêu cầu:** trước khi create, resolve owner của mỗi parent và yêu cầu quyền view/update phù hợp (theo policy BA); chặn user không được truy cập customer/lead/deal đó. Định nghĩa rõ việc người được assign có quyền xem record cha hay không.

4. **`resolveOwnerForCreate` không xác minh active khi owner là chính actor.**

   Trong thực tế actor active vì đã qua session, nên không tạo exploit trực tiếp. Tuy nhiên helper có semantic không đối xứng và không nên tái sử dụng ngoài request authenticated. Nên validate target active cho mọi owner assignment để hàm bền vững.

5. **Task update nhận schema partial có `customerId`, `leadId`, `dealId` nhưng service update không cập nhật các trường này.**

   Client hiện không gửi các trường đó, nên chưa thành lỗi visible; nhưng API contract gây hiểu nhầm: request hợp lệ có thể trả 200 mà không thay relation. Hoặc explicit omit chúng, hoặc hỗ trợ update có relation guard + authorization.

6. **Stock transfer vẫn thiếu validation kho tồn tại/active và kho nguồn khác kho đích.**

   Đã bắt buộc source/destination theo type, nhưng UUID warehouse không được kiểm tra trước khi insert/submit theo business error rõ ràng và `transfer` source=destination vẫn là phiếu vô nghĩa (cộng rồi trừ cùng balance).

7. **Document mới bảo vệ metadata; chưa phải document management.**

   Chưa có upload binary, signed download, file-object ownership, MIME sniff/antivirus, size policy theo binary, delete/retention/audit file. Không nên dùng cho hợp đồng/hồ sơ nhạy cảm dù entity permission đã được sửa.

### P1/P2 — vận hành, quality gate và scale

8. **Không có rate-limit/lockout login.** Argon2/session tốt, nhưng endpoint login vẫn chấp nhận thử password không giới hạn theo IP/email. Cần rate limit, exponential backoff/temporary lock, alert audit.

9. **Tests mới chỉ là pure unit test.** 15 tests pass nhưng không chạm PostgreSQL/route thật. Chưa chứng minh RBAC target record, migration upgrade, lead convert concurrent, confirm stock concurrent, over-payment concurrent hay HTTP retry/idempotency.

10. **Pagination ở UI vẫn local sau khi service lấy `pageSize:100`.** API có pagination, nhưng hook/service nhiều module vẫn ép 100 rồi filter/sort/paginate ở browser. Dữ liệu lớn sẽ sai range/total và tốn network; cần dùng `meta` API và đẩy filter/sort thực sự xuống DB.

11. **DB schema vẫn phần lớn dùng `varchar` cho state không có CHECK/enum/transition constraint.** Service mới đã cải thiện state machine, nhưng script/integration/DB console vẫn có thể ghi status không hợp lệ. Cần DB constraints phù hợp và migration versioned.

12. **Legacy no-op hooks vẫn tồn tại.** UI đã gỡ action sai là tốt; nhưng `useContracts`, `useMarketing`, `useOrders` vẫn expose remove/create/update no-op/throw placeholder. Cần thu gọn public API hook hoặc implement rõ để code sau này không vô tình gọi silent no-op.

## Điều chưa cần coi là lỗi

- Seed password vẫn xuất hiện trong `002_seed.sql`, nhưng login UI đã không prefill và README đã phân định local/dev. Đây không còn là P0 nếu deployment tuyệt đối không dùng seed/volume dev ở staging/prod. Tuy nhiên cần giữ secret scanning và quy trình provision admin an toàn.
- Detail drawer chưa đổi sang modal là gap với UI guideline, không phải blocker workflow.

## Kết quả kiểm chứng

| Lệnh | Kết quả |
|---|---|
| `npm test` | **Pass** — 4 files, 15 tests. |
| `npm run lint` | **Pass, 9 warnings** — các unused parameter trong hook legacy contracts/marketing/orders. |
| `npm run build` | **Pass** — production build hoàn tất, tất cả routes được tạo. |

## Quyết định khuyến nghị

Sau khi xử lý P0 migration, bản sửa **có thể dùng cho internal pilot kiểm soát** tốt hơn bản trước. Trước khi vận hành nhiều user/dữ liệu thật, cần xử lý ít nhất P1 #2 (owner reassignment), #3 (parent access), #6 (kho), #8 (login protection) và bổ sung integration/E2E test cho các luồng tiền-tồn-quyền.
