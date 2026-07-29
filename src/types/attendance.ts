export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  check_out: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
}

export interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  check_in?: string | null;
  lunch_out?: string | null;
  lunch_in?: string | null;
  check_out?: string | null;
  status: string;
  remarks?: string;
}