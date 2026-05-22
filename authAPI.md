# Tóm tắt Luồng Xác thực (Auth API) & Phân quyền Hệ thống

Tài liệu này tóm tắt toàn bộ quy trình xử lý xác thực (Authentication) và phân quyền (Authorization) dựa trên kiến trúc hiện tại của dự án Frontend (React/TypeScript).

---

## 1. Luồng Xác Thực (Authentication Flow)

### 1.1. Đăng ký tài khoản (Register)
Quy trình nhận dữ liệu form `(email, password, fullName)`, gọi API qua `authService` và điều hướng khi thành công.

**Hook xử lý (useRegister.ts):**
```typescript
const onSubmit = form.handleSubmit(async (data: RegisterInput) => {
  setIsSuccess(false);
  try {
    const payload = { email: data.email, password: data.password, fullName: data.fullName };
    const response = await authService.register(payload);
    
    if (response.success) {
      setIsSuccess(true); // Triggers useEffect to navigate to /verify-email
    } else {
      setServerError('Có lỗi xảy ra khi đăng ký. Email có thể đã tồn tại.');
    }
  } catch (error: any) {
    setServerError(error.response?.data?.message || 'Lỗi đăng ký.');
  }
});
```

**Gọi API (authService.ts):**
```typescript
async register(data: RegisterRequest): Promise<ApiResponse<string>> {
  const response = await axiosInstance.post<ApiResponse<string>>(
    '/api/v1/auth/register',
    data
  );
  return response.data;
}
```

### 1.2. Xác thực Email (Verify Email)
Khi người dùng truy cập từ link trong email có mang `token` (ví dụ: `/verify-email?token=xyz`), hệ thống tự động xác thực.

**Xử lý tự động (VerifyEmailPage.tsx):**
```typescript
useEffect(() => {
  const verifyEmail = async () => {
    if (!token) return;

    try {
      const response = await authService.verify({ token });
      if (response.success) {
        setStatus('success');
        setMessage('Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.');
      } else {
        setStatus('error');
      }
    } catch (error: any) {
      setStatus('error');
    }
  };
  verifyEmail();
}, [token]);
```

### 1.3. Gửi lại Email Xác thực (Resend Email)
Nếu token hết hạn hoặc email thất lạc, gửi lại mã xác thực.

**Xử lý (VerifyEmailPage.tsx):**
```typescript
const handleResendVerification = async () => {
  try {
    setResendLoading(true);
    const response = await authService.resendRegisterMail({
      email: resendEmail.trim(),
      password: resendPassword.trim(),
    });
    if (response.success) {
      setResendFeedback('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
    }
  } catch (error: any) {
    setResendFeedback('Không thể gửi lại email xác thực.');
  } finally {
    setResendLoading(false);
  }
};
```

### 1.4. Đăng nhập (Login)
Sau khi lấy token, giải mã Token (để lấy Roles) và điều hướng.

**Hook xử lý (useLogin.ts):**
```typescript
const onSubmit = form.handleSubmit(async (data: LoginInput & { rememberMe: boolean }) => {
  try {
    const response = await authService.login(data);

    if (response.success && response.data.accessToken) {
      dispatch(loginSuccess({ 
        ...response.data, 
        rememberMe: data.rememberMe ?? true
      }));

      // Giải mã token để lấy danh sách quyền
      const roles = getRolesFromToken(response.data.accessToken);
      let redirectPath = '/farms';

      // Điều hướng dựa vào Role
      if (roles.includes('ROLE_ADMIN')) {
        redirectPath = '/admin/dashboard';
      } else if (roles.includes('ROLE_WORKER') || roles.includes('ROLE_EMPLOYEE')) {
        redirectPath = '/tasks';
      }

      navigate(redirectPath, { replace: true });
    }
  } catch (error: any) {
    setServerError('Đăng nhập thất bại.');
  }
});
```

### 1.5. Đăng xuất (Logout)
Dọn dẹp state và token ở Redux store.

**Redux reducer (authSlice.ts):**
```typescript
logout: (state) => {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.currentFarmId = null;
  
  // Xóa cookie/storage và reset header của Axios
  AuthStorage.clearTokens();
  clearAuthHeader();
}
```

---

## 2. Cách thức Phân quyền Hệ thống (Authorization)

Hệ thống sử dụng cơ chế **Role-based Access Control (RBAC)** thông qua JSON Web Token (JWT). 

### 2.1. Phân tích quyền từ Token (`utils/auth.ts`)
Kiểm tra Role cụ thể có nằm trong JWT Payload hay không.

```typescript
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function hasRole(token: string, role: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  
  const roles = payload.roles || payload.authorities || (payload.role ? [payload.role] : []);
  const normalizedRoles = Array.isArray(roles) ? roles.map(r => r.toUpperCase()) : [];
  
  return normalizedRoles.includes(role.toUpperCase());
}
```

### 2.2. Bảo vệ Route bằng Component (ProtectedRoute.tsx)
Sử dụng `hasRole` để bọc các trang nhạy cảm trong `AppRoutes.tsx`.

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { accessToken, isAuthenticated } = useAuth();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Chặn truy cập nếu không đủ quyền
  if (!hasRole(accessToken, requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

**Cách dùng trong AppRoutes.tsx:**
```tsx
<Route element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminLayout /></ProtectedRoute>}>
  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
  <Route path="/admin/users" element={<UserManagementPage />} />
</Route>
```

### 2.3. Quyền truy cập cấp Trang trại (Farm-level Roles - PBAC)
Khi người dùng truy cập một trang trại, hệ thống kiểm tra thêm quyền sở hữu/role được trả về trong object `farm` để quyết định hiển thị các mục Menu trên Sidebar và các nút thao tác (Action Buttons).

**Bước 1: Trích xuất Role cấp trang trại (`Sidebar.tsx`)**
Hệ thống sẽ ghi đè Role hệ thống bằng Role của trang trại (nếu đang ở trong trang trại).
```typescript
const myFarmRole = currentFarm
  ? (currentFarm as any).myRole?.toLowerCase() === "worker"
    ? "employee" 
    : (currentFarm as any).myRole?.toLowerCase()
  : null;

// effectiveRole quyết định quyền thực tế của người dùng ở trang hiện tại
const effectiveRole = currentFarmId && myFarmRole ? myFarmRole : user?.role;
```

**Bước 2: Lọc các mục Menu trên Sidebar (`Sidebar.tsx`)**
Các Menu (`NAV_GROUPS`) được gắn sẵn mảng `roles` yêu cầu. Hàm `filterItem` sẽ kiểm tra `effectiveRole` để loại bỏ những Menu không đủ quyền (ví dụ: `manager` không được thấy thẻ "Thành viên").
```typescript
const filterItem = (item: { key: string; roles?: string[] }) => {
  // Ẩn các mục Global nếu đang ở trong 1 Farm
  if (["wallet", "dashboard", "notifications"].includes(item.key)) return false;

  if (!item.roles) return true; // Ai cũng xem được
  if (!effectiveRole) return false;
  
  // Chỉ hiển thị Menu nếu effectiveRole nằm trong danh sách cho phép
  return item.roles.includes(effectiveRole);
};
```

**Bước 3: Ẩn/Hiện nút thao tác ở Component Level (`FarmActionsPage.tsx` và `WarehousePage.tsx`)**
Ngay cả khi đã vào được trang, quyền chỉnh sửa (Edit/Delete) cũng được kiểm soát chặt chẽ bằng cách kiểm tra trực tiếp.

*Ví dụ 1: Manager KHÔNG được phép sửa/xóa Trang trại (`FarmActionsPage.tsx`)*
```typescript
// Bắt buộc phải là owner
const canManage = 
  farm?.owner || 
  farm?.ownerId === user?.id || 
  farm?.myRole?.toLowerCase() === 'owner';

return (
  <DashboardHeader
    onEdit={() => setIsEditModalOpen(true)}
    onDelete={() => setIsDeleteModalOpen(true)}
    showActions={canManage} // Truyền false đối với manager, 2 nút Sửa/Xóa sẽ bị ẩn
  />
);
```

*Ví dụ 2: Manager ĐƯỢC PHÉP tạo thêm/sửa Kho Hàng (`WarehousePage.tsx`)*
```typescript
// Mở rộng quyền cho manager
const canManage = myFarmRole === 'owner' || myFarmRole === 'manager' || myFarmRole === 'admin';

return (
  <div className="flex justify-between">
    <h2>Danh sách Kho hàng</h2>
    {canManage && (
      <Button onClick={handleCreateNew}>+ Thêm kho mới</Button>
    )}
  </div>
);
```

---

## 3. Luồng Lời mời & Phân quyền Thành viên (Farm Invitation & PBAC)

Hệ thống có cơ chế phân quyền kép kết hợp giữa Frontend (hiển thị UI) và Backend (bảo mật API). Quy trình mời một người vào trang trại với vai trò Quản lý diễn ra như sau:

### 3.1. Chủ trang trại (Owner) gửi lời mời
Khi Owner nhập email và chọn vai trò "Quản lý", hệ thống gửi request tạo lời mời. Lời mời sẽ ở trạng thái PENDING.

**Gọi API (`farmInvitationService.ts`):**
```typescript
// Endpoint: POST /api/v1/farms/{farmId}/members
async sendInvitation(farmId: string, data: SendInvitationRequest): Promise<string> {
  const response = await axiosInstance.post(`/api/v1/farms/${farmId}/members`, data);
  return response.data; // Trả về text ID lời mời
}
```

### 3.2. Người được mời chấp nhận lời mời
Khi người được mời click vào email và nhấn Đồng ý, tài khoản của họ chính thức được thêm vào bảng FarmMembers của DB với role là `MANAGER`.

**Gọi API (`farmInvitationService.ts`):**
```typescript
// Endpoint: POST /api/v1/invitations/{invitationId}/accept
async acceptInvitation(invitationId: string): Promise<AcceptInvitationResponse> {
  const response = await axiosInstance.post(`/api/v1/invitations/${invitationId}/accept`);
  return response.data; // Trả về thông tin User đã join thành công
}
```

### 3.3. Cấp phát quyền và xử lý UI/API
Khi người quản lý (Manager) đăng nhập vào hệ thống, quá trình này rẽ làm 2 nhánh rõ rệt:

**Nhánh 1: Trên Frontend (Phục vụ UI/Trải nghiệm)**
- API get danh sách trang trại (`/api/v1/farms/summary`) sẽ trả về JSON chứa dòng `"myRole": "MANAGER"`.
- Frontend dùng biến chữ này (`MANAGER`) đưa vào logic (đã mô tả ở Phần 2.3) để **ẩn/hiện các tab Sidebar** và **ẩn các nút nhạy cảm**. Frontend **không** cần giải mã Token phức tạp để vẽ giao diện.

**Nhánh 2: Trên Backend (Phục vụ Bảo mật/API)**
- Khi Quản lý click chọn Farm, Frontend gọi `POST /api/v1/farms/{farmId}/select`.
- Backend kiểm tra trong DB thấy người này là `MANAGER`, lập tức sinh ra một **Farm Token** riêng biệt.
- Trong `farmToken` này, Backend đã nhúng sẵn một mảng danh sách các quyền hạn thao tác thực tế (perms), ví dụ: `["warehouse:manage", "report:read", "plan:update"...]`.
- Kể từ lúc đó, mỗi khi Manager ấn nút "Lưu kho hàng", Frontend sẽ gửi Farm Token này lên. Backend kiểm tra mảng `perms` xem có khớp quyền hay không. Nếu có thì cho phép, nếu không thì trả về lỗi 403 Forbidden.
