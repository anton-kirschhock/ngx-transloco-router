import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matcher',
  templateUrl: './matcher.component.html',
  styleUrls: ['./matcher.component.scss'],
})
export class MatcherComponent implements OnInit, OnDestroy {
  params: string[] = [];
  private paramsSubscription: Subscription;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe((paramMap) => {
      this.params = [];
      const keys = [...paramMap.keys];
      for (const key of keys) {
        this.params.push(`${key}: ${paramMap.get(key)}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
  }
}
