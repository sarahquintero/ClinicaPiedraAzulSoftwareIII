import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiItemResponse,
  ApiListResponse,
  CitaApiItem,
  CreateCitaPayload,
  CreateMedicoPayload,
  CreatePacientePayload,
  MedicoApiItem,
  PacienteApiItem,
  VerificarCedulaResponse,
} from '../models/clinic.models';

const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class ClinicApiService {
  private readonly http = inject(HttpClient);

  // Médicos
  getMedicosPublic(): Observable<ApiListResponse<MedicoApiItem>> {
    return this.http.get<ApiListResponse<MedicoApiItem>>(`${API_BASE_URL}/medicos`);
  }

  getMedicosAdmin(): Observable<ApiListResponse<MedicoApiItem>> {
    return this.http.get<ApiListResponse<MedicoApiItem>>(`${API_BASE_URL}/medicos/admin`);
  }

  createMedico(payload: CreateMedicoPayload): Observable<ApiItemResponse<MedicoApiItem>> {
    return this.http.post<ApiItemResponse<MedicoApiItem>>(`${API_BASE_URL}/medicos`, payload);
  }

  // Pacientes
  verificarCedula(cedula: string): Observable<VerificarCedulaResponse> {
    const clean = encodeURIComponent(cedula.trim());
    return this.http.get<VerificarCedulaResponse>(
      `${API_BASE_URL}/pacientes/verificar-cedula/${clean}`
    );
  }

  getPacientesAdmin(): Observable<ApiListResponse<PacienteApiItem>> {
    return this.http.get<ApiListResponse<PacienteApiItem>>(`${API_BASE_URL}/pacientes`);
  }

  createPaciente(payload: CreatePacientePayload): Observable<ApiItemResponse<PacienteApiItem>> {
    return this.http.post<ApiItemResponse<PacienteApiItem>>(`${API_BASE_URL}/pacientes`, payload);
  }

  // Citas
  getCitasAdmin(): Observable<ApiListResponse<CitaApiItem>> {
    return this.http.get<ApiListResponse<CitaApiItem>>(`${API_BASE_URL}/citas`);
  }

  getMisCitasPaciente(): Observable<ApiListResponse<CitaApiItem>> {
    return this.http.get<ApiListResponse<CitaApiItem>>(`${API_BASE_URL}/citas/mis-citas`);
  }

  createCitaAdmin(payload: CreateCitaPayload): Observable<ApiItemResponse<CitaApiItem>> {
    return this.http.post<ApiItemResponse<CitaApiItem>>(`${API_BASE_URL}/citas`, payload);
  }
}
