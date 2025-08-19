import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { VerifyEmailComponent } from './components/verifyEmail/verifyEmail';
import { GenerateComponent } from './components/generate/generate';
import { HistoryComponent } from './components/history/history';
import { ProfileComponent } from './components/profile/profile';
import { AuthGuard } from './services/auth.guard';
import { VerifiedEmailGuard } from './services/verifiedEmail.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'generate', component: GenerateComponent, canActivate: [AuthGuard, VerifiedEmailGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard, VerifiedEmailGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard, VerifiedEmailGuard] },
  { path: '**', redirectTo: 'home' }  // catch-all fallback
];
