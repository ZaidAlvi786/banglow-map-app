import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SatelliteService } from '../../services/satellite.service';

@Component({
  selector: 'app-common-dailogs',
  standalone: true,
  imports: [CommonModule,FormsModule,MatFormFieldModule,ReactiveFormsModule,MatInputModule],
  templateUrl: './common-dailogs.component.html',
  styleUrl: './common-dailogs.component.scss'
})
export class CommonDailogsComponent implements OnInit  {
  name: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
   private satelliteService:SatelliteService,
   public dialogRef: MatDialogRef<CommonDailogsComponent>
  ){}

  ngOnInit(): void {
    if(this.data.type === 'rename'){
      this.name = this.data?.group?.name
    }
  }
  addGroup(){
    console.log(this.data,'aaaaaaaaaaaaaaaaaaaa');
    
    let payload
    if(this.data.type === 'addSubgroup'){
      payload = {
        name: this.name,
        parent:this.data.parent,
        notification:false,
      }
    } else {
      payload = {
        name: this.name,
        notification:false,
      }
    }
     
    this.satelliteService.addGroup(payload).subscribe({
      next: (resp) => {
        console.log(resp, 'respresprespresprespresprespresprespresp');
        this.dialogRef.close(resp)

      }
    })
  }

  renameGroup(){
    const payload = {
      group_id: this.data.group.id,
      name: this.name,
    }
    this.updateGroup(payload)
  }

  deleteGroup(){
    const payload = {
      group_id: this.data.group.id,
      is_deleted: true,
      name: this.data.group.name
    }
    this.updateGroup(payload)
  }

  updateGroup(payload: any) {
    this.satelliteService.updateGroup(payload).subscribe({
      next: (resp) =>{
        this.dialogRef.close(resp)
      },
      error(err) {
        
      },
    })
  }

  closeDialog(){
    this.dialogRef.close()
  }
}
